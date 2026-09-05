#!/bin/bash
set -e

if [[ -z "$VERSION" ]]; then
  echo "Must provide VERSION environment" 1>&2
  exit 1
fi

STACK_VERSION=14
STACK_VERSION_FILE="/var/lib/timelines/stack-version"

GATEKEEPER_VERSION=2
GATEKEEPER_VERSION_FILE="/var/lib/timelines/gatekeeper-version"

# Check if we need to do a full deploy instead of update
NEEDS_DEPLOY=false
if [[ ! -f "$STACK_VERSION_FILE" ]]; then
  echo "Stack version file not found, will run full deploy"
  NEEDS_DEPLOY=true
elif [[ "$(cat "$STACK_VERSION_FILE")" != "$STACK_VERSION" ]]; then
  echo "Stack version changed ($(cat "$STACK_VERSION_FILE") -> $STACK_VERSION), will run full deploy"
  NEEDS_DEPLOY=true
fi

if $NEEDS_DEPLOY; then
  echo "Running stack-deploy.sh instead of update..."
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  "$SCRIPT_DIR/stack-deploy.sh"
  
  # Save the new stack version
  mkdir -p "$(dirname "$STACK_VERSION_FILE")"
  echo "$STACK_VERSION" > "$STACK_VERSION_FILE"
  echo "Stack version saved: $STACK_VERSION"
  echo "$GATEKEEPER_VERSION" > "$GATEKEEPER_VERSION_FILE"

  exit 0
fi

docker system prune -f

SERVICES=("timelines_rhea" "timelines_calliope" "timelines_styx" "timelines_orpheus" "timelines_thetis" "timelines_chronos")
IMAGES=(
  "tenebrie/timelines-rhea:${VERSION}"
  "tenebrie/timelines-calliope:${VERSION}"
  "tenebrie/timelines-styx:${VERSION}"
  "tenebrie/timelines-orpheus:${VERSION}"
  "tenebrie/timelines-thetis:${VERSION}"
  "tenebrie/timelines-chronos:${VERSION}"
)

for i in "${!SERVICES[@]}"; do
  docker service update --image "${IMAGES[$i]}" "${SERVICES[$i]}" &
done

wait

# Wait for all services to finish updating
echo "Waiting for rollouts to complete..."
for svc in "${SERVICES[@]}"; do
  while true; do
    STATE=$(docker service inspect --format '{{.UpdateStatus.State}}' "$svc")
    if [[ "$STATE" != "updating" ]]; then
      break
    fi
    sleep 2
  done
done

FAILED=false
for svc in "${SERVICES[@]}"; do
  STATE=$(docker service inspect --format '{{.UpdateStatus.State}}' "$svc")
  if [[ "$STATE" != "completed" ]]; then
    echo "FAILED: $svc state is $STATE"
    echo "--- $svc task history ---"
    docker service ps "$svc" --no-trunc --format "table {{.Name}}\t{{.CurrentState}}\t{{.Error}}"
    echo "--- $svc recent logs ---"
    docker service logs --tail 100 "$svc" 2>&1 || true
    FAILED=true
  fi
done

if $FAILED; then
  echo "Rolling back all services..."
  for svc in "${SERVICES[@]}"; do
    docker service update --rollback "$svc" &
  done
  wait
  exit 1
fi

if [[ ! -f "$GATEKEEPER_VERSION_FILE" || "$(cat "$GATEKEEPER_VERSION_FILE")" != "$GATEKEEPER_VERSION" ]]; then
  docker service update --image "tenebrie/timelines-gatekeeper:${VERSION}" "timelines_gatekeeper"
  echo "$GATEKEEPER_VERSION" > "$GATEKEEPER_VERSION_FILE"
else
  echo "Gatekeeper version unchanged ($GATEKEEPER_VERSION), skipping update"
fi

echo "All services updated successfully"
docker system prune -f