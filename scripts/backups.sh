#!/bin/bash
# Database Backup Management Tool

CONTAINER=$(docker ps -qf "name=timelines[-_]chronos")

if [ -z "${CONTAINER}" ]; then
    echo "ERROR: Backrest container not found"
    echo "Make sure the stack is running with: npm run dev"
    exit 1
fi

COMMAND="$1"

case "${COMMAND}" in
    list)
        docker exec -it "${CONTAINER}" /scripts/backup-tool.sh list
        ;;
    create)
        # Use -t only if we have a TTY (not in CI)
        if [ -t 1 ]; then
            docker exec -it "${CONTAINER}" /scripts/backup-tool.sh create
        else
            docker exec "${CONTAINER}" /scripts/backup-tool.sh create
        fi
        ;;
    restore)
        docker exec -it "${CONTAINER}" /scripts/backup-tool.sh restore
        ;;
    *)
        echo "Neverkin Database Backup Tool"
        echo ""
        echo "Usage:"
        echo "  ./scripts/backups.sh list       List all available snapshots"
        echo "  ./scripts/backups.sh create     Create a new backup now"
        echo "  ./scripts/backups.sh restore    Interactive restore"
        exit 1
        ;;
esac
