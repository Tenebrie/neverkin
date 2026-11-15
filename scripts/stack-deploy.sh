#!/bin/bash
set -e

if [[ -z "$VERSION" ]]; then
    echo "Must provide VERSION environment" 1>&2
    exit 1
fi

docker stack deploy -c docker-compose.common.yml -c docker-compose.prod.yml timelines

SERVICES=(
  "timelines_gatekeeper"
  "timelines_styx"
  "timelines_rhea"
  "timelines_calliope"
  "timelines_orpheus"
  "timelines_thetis"
  "timelines_chronos"
)

echo "Waiting for services to converge..."
for svc in "${SERVICES[@]}"; do
  echo "Waiting for $svc..."
  while true; do
    # Check if service exists yet
    if ! docker service inspect "$svc" &>/dev/null; then
      sleep 2
      continue
    fi
    
    # Get current state
    REPLICAS=$(docker service ls --filter "name=$svc" --format "{{.Replicas}}")
    CURRENT=$(echo "$REPLICAS" | cut -d'/' -f1)
    DESIRED=$(echo "$REPLICAS" | cut -d'/' -f2)
    
    if [[ "$CURRENT" == "$DESIRED" && "$DESIRED" != "0" ]]; then
      echo "$svc is ready ($REPLICAS)"
      break
    fi
    
    sleep 2
  done
done

echo -e "\nAll services deployed successfully!"

# Run prune regardless of status codes
echo -e "\nCleaning up after Docker..."
docker system prune -af