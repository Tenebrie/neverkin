-- CreateTable
CREATE TABLE "MindmapLinkWaypoint" (
    "id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "positionX" INTEGER NOT NULL,
    "positionY" INTEGER NOT NULL,
    "linkId" TEXT NOT NULL,

    CONSTRAINT "MindmapLinkWaypoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MindmapLinkWaypoint_linkId_idx" ON "MindmapLinkWaypoint"("linkId");

-- AddForeignKey
ALTER TABLE "MindmapLinkWaypoint" ADD CONSTRAINT "MindmapLinkWaypoint_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "MindmapLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
