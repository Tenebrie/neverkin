-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "Actor_name_title_content_idx" ON "Actor" USING GIN ("name" gin_trgm_ops, "title" gin_trgm_ops, "content" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ContentPage_name_content_idx" ON "ContentPage" USING GIN ("name" gin_trgm_ops, "content" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Tag_name_description_idx" ON "Tag" USING GIN ("name" gin_trgm_ops, "description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "WikiArticle_name_content_idx" ON "WikiArticle" USING GIN ("name" gin_trgm_ops, "content" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "WorldEvent_name_content_idx" ON "WorldEvent" USING GIN ("name" gin_trgm_ops, "content" gin_trgm_ops);
