#!/bin/bash
set -e

# Database Backup Tool
# ====================
# Usage:
#   /scripts/backup-tool.sh list       List all available snapshots
#   /scripts/backup-tool.sh restore    Interactive restore
#   /scripts/backup-tool.sh create     Create a new backup now

RESTORE_DIR="/data/restore"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# Setup environment variables (same logic as entrypoint.sh)
# ============================================================
setup_env() {
    if [ -f /run/secrets/s3-access-key-id ]; then
        # Production: read from secrets
        export AWS_ACCESS_KEY_ID=$(cat /run/secrets/s3-access-key-id)
        export AWS_SECRET_ACCESS_KEY=$(cat /run/secrets/s3-access-key-secret)
        S3_BUCKET=$(cat /run/secrets/s3-bucket-id)
        S3_ENDPOINT=$(cat /run/secrets/s3-endpoint)
    else
        # Development: read from environment variables
        export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}"
        export AWS_SECRET_ACCESS_KEY="${S3_ACCESS_KEY_SECRET}"
        S3_BUCKET="${S3_BUCKET}"
        S3_ENDPOINT="${S3_ENDPOINT}"
    fi

    export RESTIC_PASSWORD="timelines-backups"

    # Convert endpoint to restic S3 format
    if echo "$S3_ENDPOINT" | grep -q "^http://"; then
        export RESTIC_REPOSITORY="s3:${S3_ENDPOINT}/${S3_BUCKET}/rhea/backrest"
    else
        S3_HOST=$(echo "$S3_ENDPOINT" | sed 's|https://||')
        export RESTIC_REPOSITORY="s3:${S3_HOST}/${S3_BUCKET}/rhea/backrest"
    fi
}

# ============================================================
# Fetch and display snapshots
# ============================================================
fetch_snapshots() {
    SNAPSHOTS=$(restic -r "${RESTIC_REPOSITORY}" snapshots --json 2>/dev/null)
    
    if [ -z "${SNAPSHOTS}" ] || [ "${SNAPSHOTS}" = "null" ] || [ "${SNAPSHOTS}" = "[]" ]; then
        echo -e "${RED}ERROR: No snapshots found in repository${NC}"
        exit 1
    fi
    
    SNAPSHOT_COUNT=$(echo "${SNAPSHOTS}" | jq 'length')
}

display_snapshots() {
    echo ""
    echo -e "${GREEN}Available snapshots:${NC}"
    echo "────────────────────────────────────────────────────────────────"
    printf "%-4s %-12s %-20s %s\n" "#" "ID" "Date" "Hostname"
    echo "────────────────────────────────────────────────────────────────"
    
    for i in $(seq 0 $((SNAPSHOT_COUNT - 1))); do
        ID=$(echo "${SNAPSHOTS}" | jq -r ".[$i].short_id")
        TIME=$(echo "${SNAPSHOTS}" | jq -r ".[$i].time" | cut -d'T' -f1,2 | tr 'T' ' ' | cut -d':' -f1,2)
        HOST=$(echo "${SNAPSHOTS}" | jq -r ".[$i].hostname")
        printf "%-4s %-12s %-20s %s\n" "$((i + 1))" "${ID}" "${TIME}" "${HOST}"
    done
    
    echo "────────────────────────────────────────────────────────────────"
    echo ""
}

# ============================================================
# List command
# ============================================================
cmd_list() {
    echo -e "${YELLOW}Fetching available snapshots...${NC}"
    fetch_snapshots
    display_snapshots
    
    echo -e "To restore a backup, run:"
    echo -e "  ${GREEN}./scripts/restore-backup.sh restore${NC}"
}

# ============================================================
# Backup command
# ============================================================
cmd_backup() {
    echo -e "${BLUE}Creating database backup...${NC}"
    echo ""
    
    # Step 1: Dump the database
    echo -e "${YELLOW}Step 1/3: Dumping database...${NC}"
    /scripts/pre-backup.sh
    
    # Step 2: Create restic snapshot
    echo ""
    echo -e "${YELLOW}Step 2/3: Creating snapshot...${NC}"
    restic -r "${RESTIC_REPOSITORY}" backup /data/backup
    
    # Step 3: Apply retention policy to keep the repository tidy
    # This ensures manual backups are also cleaned up by the same policy
    # that governs scheduled backups.
    echo ""
    echo -e "${YELLOW}Step 3/3: Applying retention policy...${NC}"
    restic -r "${RESTIC_REPOSITORY}" forget \
        --keep-last 4 \
        --keep-hourly 24 \
        --keep-daily 7 \
        --keep-weekly 4 \
        --keep-monthly 12 \
        --keep-yearly 3 \
        --prune
    
    echo ""
    echo -e "${GREEN}Backup completed successfully!${NC}"
}

# ============================================================
# Restore command - interactive only
# ============================================================
cmd_restore() {
    echo -e "${YELLOW}Fetching available snapshots...${NC}"
    fetch_snapshots
    display_snapshots
    
    echo -e "${YELLOW}Enter snapshot number (1-${SNAPSHOT_COUNT}):${NC}"
    read -r SELECTION
    
    # Validate selection
    if ! [[ "${SELECTION}" =~ ^[0-9]+$ ]] || [ "${SELECTION}" -lt 1 ] || [ "${SELECTION}" -gt "${SNAPSHOT_COUNT}" ]; then
        echo -e "${RED}ERROR: Invalid selection. Please enter a number between 1 and ${SNAPSHOT_COUNT}${NC}"
        exit 1
    fi
    
    SNAPSHOT_ID=$(echo "${SNAPSHOTS}" | jq -r ".[$(($SELECTION - 1))].short_id")
    echo -e "Selected: #${SELECTION} → ${GREEN}${SNAPSHOT_ID}${NC}"
    
    echo ""
    echo -e "${YELLOW} ${NC}"
    echo -e "${YELLOW}WARNING: This will DROP the entire database and restore!${NC}"
    echo -e "${YELLOW} ${NC}"
    echo ""
    echo -e "${YELLOW}Press Enter to continue, or Ctrl+C to cancel...${NC}"
    read -r
    
    # Clean up restore directory
    echo ""
    echo -e "${BLUE}Step 1/4: Cleaning restore directory...${NC}"
    rm -rf "${RESTORE_DIR:?}"/*
    mkdir -p "${RESTORE_DIR}"
    
    # Restore snapshot using restic
    echo -e "${BLUE}Step 2/4: Extracting snapshot from backup...${NC}"
    restic -r "${RESTIC_REPOSITORY}" restore "${SNAPSHOT_ID}" --target "${RESTORE_DIR}"
    
    # Find the SQL file
    SQL_FILES=$(find "${RESTORE_DIR}" -name "*.sql" -type f 2>/dev/null || true)
    
    if [ -z "${SQL_FILES}" ]; then
        echo -e "${RED}ERROR: No SQL file found in restored snapshot${NC}"
        exit 1
    fi
    
    FILE_COUNT=$(echo "${SQL_FILES}" | wc -l | tr -d ' ')
    
    if [ "${FILE_COUNT}" -gt 1 ]; then
        echo -e "${RED}ERROR: Multiple SQL files found:${NC}"
        echo "${SQL_FILES}"
        exit 1
    fi
    
    DUMP_FILE="${SQL_FILES}"
    echo -e "Found: ${GREEN}${DUMP_FILE}${NC}"
    echo -e "Size: ${GREEN}$(du -h "${DUMP_FILE}" | cut -f1)${NC}"
    
    # Drop and recreate database
    echo ""
    echo -e "${BLUE}Step 3/4: Dropping and recreating database...${NC}"
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
        -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" \
        -c "CREATE DATABASE ${POSTGRES_DB};"
    
    # Restore the database
    echo -e "${BLUE}Step 4/4: Restoring database from dump...${NC}"
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -f "${DUMP_FILE}"
    
    # Cleanup
    echo ""
    echo -e "${BLUE}Cleaning up...${NC}"
    rm -rf "${RESTORE_DIR:?}"/*
    
    echo ""
    echo -e "${GREEN}Database restore completed successfully!${NC}"
}

# ============================================================
# Main
# ============================================================
setup_env

COMMAND="$1"
shift 2>/dev/null || true

case "${COMMAND}" in
    list)
        cmd_list
        ;;
    create)
        cmd_backup
        ;;
    restore)
        cmd_restore
        ;;
    *)
        echo "Usage:"
        echo "  /scripts/backup-tool.sh list       List all available snapshots"
        echo "  /scripts/backup-tool.sh create     Create a new backup now"
        echo "  /scripts/backup-tool.sh restore    Interactive restore"
        exit 1
        ;;
esac
