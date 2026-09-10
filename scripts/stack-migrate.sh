mkdir -p /mnt/volume_rhea_postgres/data

POSTGRES=$(docker ps -qf "name=timelines[-_]rhea-postgres" | head -n 1)
docker run --rm --network "container:${POSTGRES}" \
  -e DATABASE_URL=postgresql://docker:docker@localhost:5432/db?schema=public \
  tenebrie/timelines-rhea:${VERSION} \
  sh -c "npx prisma migrate deploy && node dist/prisma/seed.js"
