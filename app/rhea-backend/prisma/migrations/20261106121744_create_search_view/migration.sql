-- CreateView
CREATE VIEW "WorldSearchEntry" AS
SELECT
    actor."worldId",
    'Actor'::"MentionedEntity" AS "entityType",
    actor."id" AS "entityId",
    NULL::TEXT AS "pageId",
    actor."name",
    actor."title",
    actor."content",
    NULL::BIGINT AS "timestamp"
FROM "Actor" actor

UNION ALL

SELECT
    article."worldId",
    'Article'::"MentionedEntity",
    article."id",
    NULL::TEXT,
    article."name",
    NULL::TEXT,
    article."content",
    NULL::BIGINT
FROM "WikiArticle" article

UNION ALL

SELECT
    event."worldId",
    'Event'::"MentionedEntity",
    event."id",
    NULL::TEXT,
    event."name",
    NULL::TEXT,
    event."content",
    event."timestamp"
FROM "WorldEvent" event

UNION ALL

SELECT
    tag."worldId",
    'Tag'::"MentionedEntity",
    tag."id",
    NULL::TEXT,
    tag."name",
    NULL::TEXT,
    tag."description",
    NULL::BIGINT
FROM "Tag" tag

UNION ALL

SELECT
    actor."worldId",
    'Actor'::"MentionedEntity",
    actor."id",
    page."id",
    page."name",
    NULL::TEXT,
    page."content",
    NULL::BIGINT
FROM "ContentPage" page
JOIN "Actor" actor ON page."parentActorId" = actor."id"

UNION ALL

SELECT
    article."worldId",
    'Article'::"MentionedEntity",
    article."id",
    page."id",
    page."name",
    NULL::TEXT,
    page."content",
    NULL::BIGINT
FROM "ContentPage" page
JOIN "WikiArticle" article ON page."parentArticleId" = article."id"

UNION ALL

SELECT
    event."worldId",
    'Event'::"MentionedEntity",
    event."id",
    page."id",
    page."name",
    NULL::TEXT,
    page."content",
    event."timestamp"
FROM "ContentPage" page
JOIN "WorldEvent" event ON page."parentEventId" = event."id";
