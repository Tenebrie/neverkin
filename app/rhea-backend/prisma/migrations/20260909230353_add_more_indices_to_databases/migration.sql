-- DropIndex
DROP INDEX "User_email_idx";

-- CreateIndex
CREATE INDEX "Actor_worldId_parentFolderId_idx" ON "Actor"("worldId", "parentFolderId");

-- CreateIndex
CREATE INDEX "Asset_ownerId_idx" ON "Asset"("ownerId");

-- CreateIndex
CREATE INDEX "AssetReference_holderActorId_idx" ON "AssetReference"("holderActorId");

-- CreateIndex
CREATE INDEX "AssetReference_holderEventId_idx" ON "AssetReference"("holderEventId");

-- CreateIndex
CREATE INDEX "AssetReference_holderArticleId_idx" ON "AssetReference"("holderArticleId");

-- CreateIndex
CREATE INDEX "AssetReference_holderTagId_idx" ON "AssetReference"("holderTagId");

-- CreateIndex
CREATE INDEX "AssetReference_holderNodeId_idx" ON "AssetReference"("holderNodeId");

-- CreateIndex
CREATE INDEX "AssetReference_pageId_idx" ON "AssetReference"("pageId");

-- CreateIndex
CREATE INDEX "AssetReference_worldId_idx" ON "AssetReference"("worldId");

-- CreateIndex
CREATE INDEX "Calendar_worldId_idx" ON "Calendar"("worldId");

-- CreateIndex
CREATE INDEX "Calendar_ownerId_idx" ON "Calendar"("ownerId");

-- CreateIndex
CREATE INDEX "CollaboratingUser_worldId_idx" ON "CollaboratingUser"("worldId");

-- CreateIndex
CREATE INDEX "ContentPage_parentActorId_idx" ON "ContentPage"("parentActorId");

-- CreateIndex
CREATE INDEX "ContentPage_parentEventId_idx" ON "ContentPage"("parentEventId");

-- CreateIndex
CREATE INDEX "ContentPage_parentArticleId_idx" ON "ContentPage"("parentArticleId");

-- CreateIndex
CREATE INDEX "ContentPage_parentNodeId_idx" ON "ContentPage"("parentNodeId");

-- CreateIndex
CREATE INDEX "Mention_sourceActorId_idx" ON "Mention"("sourceActorId");

-- CreateIndex
CREATE INDEX "Mention_sourceEventId_idx" ON "Mention"("sourceEventId");

-- CreateIndex
CREATE INDEX "Mention_sourceArticleId_idx" ON "Mention"("sourceArticleId");

-- CreateIndex
CREATE INDEX "Mention_sourceTagId_idx" ON "Mention"("sourceTagId");

-- CreateIndex
CREATE INDEX "Mention_sourceNodeId_idx" ON "Mention"("sourceNodeId");

-- CreateIndex
CREATE INDEX "Mention_targetActorId_idx" ON "Mention"("targetActorId");

-- CreateIndex
CREATE INDEX "Mention_targetEventId_idx" ON "Mention"("targetEventId");

-- CreateIndex
CREATE INDEX "Mention_targetArticleId_idx" ON "Mention"("targetArticleId");

-- CreateIndex
CREATE INDEX "Mention_targetTagId_idx" ON "Mention"("targetTagId");

-- CreateIndex
CREATE INDEX "Mention_pageId_idx" ON "Mention"("pageId");

-- CreateIndex
CREATE INDEX "MindmapLink_sourceNodeId_targetNodeId_idx" ON "MindmapLink"("sourceNodeId", "targetNodeId");

-- CreateIndex
CREATE INDEX "MindmapLink_targetNodeId_idx" ON "MindmapLink"("targetNodeId");

-- CreateIndex
CREATE INDEX "MindmapNode_worldId_idx" ON "MindmapNode"("worldId");

-- CreateIndex
CREATE INDEX "MindmapNode_parentActorId_idx" ON "MindmapNode"("parentActorId");

-- CreateIndex
CREATE INDEX "MindmapNode_parentArticleId_idx" ON "MindmapNode"("parentArticleId");

-- CreateIndex
CREATE INDEX "MindmapNode_parentEventId_idx" ON "MindmapNode"("parentEventId");

-- CreateIndex
CREATE INDEX "MindmapNode_parentFolderId_idx" ON "MindmapNode"("parentFolderId");

-- CreateIndex
CREATE INDEX "MindmapNode_parentTagId_idx" ON "MindmapNode"("parentTagId");

-- CreateIndex
CREATE INDEX "Tag_worldId_parentFolderId_idx" ON "Tag"("worldId", "parentFolderId");

-- CreateIndex
CREATE INDEX "UserAnnouncement_userId_idx" ON "UserAnnouncement"("userId");

-- CreateIndex
CREATE INDEX "UserFavoriteIconSet_userId_idx" ON "UserFavoriteIconSet"("userId");

-- CreateIndex
CREATE INDEX "WikiArticle_worldId_parentFolderId_idx" ON "WikiArticle"("worldId", "parentFolderId");

-- CreateIndex
CREATE INDEX "WikiFolder_worldId_parentFolderId_idx" ON "WikiFolder"("worldId", "parentFolderId");

-- CreateIndex
CREATE INDEX "World_ownerId_idx" ON "World"("ownerId");

-- CreateIndex
CREATE INDEX "WorldCommonIconSet_worldId_idx" ON "WorldCommonIconSet"("worldId");

-- CreateIndex
CREATE INDEX "WorldEvent_worldId_parentFolderId_idx" ON "WorldEvent"("worldId", "parentFolderId");

-- CreateIndex
CREATE INDEX "WorldEvent_worldEventTrackId_idx" ON "WorldEvent"("worldEventTrackId");

-- CreateIndex
CREATE INDEX "WorldEventDelta_worldEventId_timestamp_idx" ON "WorldEventDelta"("worldEventId", "timestamp");

-- CreateIndex
CREATE INDEX "WorldEventTrack_worldId_idx" ON "WorldEventTrack"("worldId");

-- CreateIndex
CREATE INDEX "WorldShareLink_worldId_idx" ON "WorldShareLink"("worldId");
