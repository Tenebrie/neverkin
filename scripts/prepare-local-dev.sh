#!/bin/bash
export DOCKER_UID=$(id -u)
export DOCKER_GID=$(id -g)

# Skip the build manifest to keep containers identity across rebuilds when nothing changes.
export BUILDX_NO_DEFAULT_ATTESTATIONS=1

mkdir -p ./app/styx-frontend/node_modules/.tanstack/tmp-docker
chown -R ${DOCKER_UID}:${DOCKER_GID} ./app/styx-frontend/node_modules/.tanstack/tmp-docker
