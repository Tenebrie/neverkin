-- CreateTable
CREATE TABLE "UserWorldPin" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,

    CONSTRAINT "UserWorldPin_pkey" PRIMARY KEY ("userId","worldId")
);

-- CreateIndex
CREATE INDEX "UserWorldPin_worldId_idx" ON "UserWorldPin"("worldId");

-- AddForeignKey
ALTER TABLE "UserWorldPin" ADD CONSTRAINT "UserWorldPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorldPin" ADD CONSTRAINT "UserWorldPin_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;
