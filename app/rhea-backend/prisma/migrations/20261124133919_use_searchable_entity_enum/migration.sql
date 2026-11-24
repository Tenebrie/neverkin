-- ReplaceView
DROP VIEW "WorldSearchEntry";

CREATE VIEW "WorldSearchEntry" AS
SELECT
    actor."worldId",
    'Actor'::"SearchableEntity" AS "entityType",
    actor."id" AS "entityId",
    NULL::TEXT AS "pageId",
    actor."name",
    actor."title",
    actor."content",
    NULL::BIGINT AS "timestamp",
    actor."createdAt",
    actor."updatedAt",
    actor."icon",
    actor."color"
FROM "Actor" actor

UNION ALL

SELECT
    article."worldId",
    'Article'::"SearchableEntity",
    article."id",
    NULL::TEXT,
    article."name",
    NULL::TEXT,
    article."content",
    NULL::BIGINT,
    article."createdAt",
    article."updatedAt",
    article."icon",
    article."color"
FROM "WikiArticle" article

UNION ALL

SELECT
    event."worldId",
    'Event'::"SearchableEntity",
    event."id",
    NULL::TEXT,
    event."name",
    NULL::TEXT,
    event."content",
    event."timestamp",
    event."createdAt",
    event."updatedAt",
    event."icon",
    event."color"
FROM "WorldEvent" event

UNION ALL

SELECT
    tag."worldId",
    'Tag'::"SearchableEntity",
    tag."id",
    NULL::TEXT,
    tag."name",
    NULL::TEXT,
    tag."description",
    NULL::BIGINT,
    tag."createdAt",
    tag."updatedAt",
    tag."icon",
    tag."color"
FROM "Tag" tag

UNION ALL

SELECT
    folder."worldId",
    'Folder'::"SearchableEntity",
    folder."id",
    NULL::TEXT,
    folder."name",
    NULL::TEXT,
    '',
    NULL::BIGINT,
    folder."createdAt",
    folder."updatedAt",
    folder."icon",
    folder."color"
FROM "WikiFolder" folder

UNION ALL

SELECT
    node."worldId",
    'Node'::"SearchableEntity",
    node."id",
    NULL::TEXT,
    node."name",
    NULL::TEXT,
    node."content",
    NULL::BIGINT,
    node."createdAt",
    node."updatedAt",
    node."icon",
    node."color"
FROM "MindmapNode" node
WHERE node."parentActorId" IS NULL
    AND node."parentArticleId" IS NULL
    AND node."parentEventId" IS NULL
    AND node."parentFolderId" IS NULL
    AND node."parentTagId" IS NULL

UNION ALL

SELECT
    actor."worldId",
    'Actor'::"SearchableEntity",
    actor."id",
    page."id",
    page."name",
    NULL::TEXT,
    page."content",
    NULL::BIGINT,
    page."createdAt",
    page."updatedAt",
    actor."icon",
    actor."color"
FROM "ContentPage" page
JOIN "Actor" actor ON page."parentActorId" = actor."id"

UNION ALL

SELECT
    article."worldId",
    'Article'::"SearchableEntity",
    article."id",
    page."id",
    page."name",
    NULL::TEXT,
    page."content",
    NULL::BIGINT,
    page."createdAt",
    page."updatedAt",
    article."icon",
    article."color"
FROM "ContentPage" page
JOIN "WikiArticle" article ON page."parentArticleId" = article."id"

UNION ALL

SELECT
    event."worldId",
    'Event'::"SearchableEntity",
    event."id",
    page."id",
    page."name",
    NULL::TEXT,
    page."content",
    event."timestamp",
    page."createdAt",
    page."updatedAt",
    event."icon",
    event."color"
FROM "ContentPage" page
JOIN "WorldEvent" event ON page."parentEventId" = event."id"

UNION ALL

SELECT
    node."worldId",
    'Node'::"SearchableEntity",
    node."id",
    page."id",
    page."name",
    NULL::TEXT,
    page."content",
    NULL::BIGINT,
    page."createdAt",
    page."updatedAt",
    node."icon",
    node."color"
FROM "ContentPage" page
JOIN "MindmapNode" node ON page."parentNodeId" = node."id"
WHERE node."parentActorId" IS NULL
    AND node."parentArticleId" IS NULL
    AND node."parentEventId" IS NULL
    AND node."parentFolderId" IS NULL
    AND node."parentTagId" IS NULL;
