-- Clear table
DELETE FROM "FeatureFlagEntry";

-- AlterTable
ALTER TABLE "FeatureFlagEntry" DROP COLUMN "flag",
ADD COLUMN     "flag" TEXT NOT NULL;

-- DropEnum
DROP TYPE "FeatureFlag";

-- CreateIndex
CREATE INDEX "FeatureFlagEntry_userId_flag_idx" ON "FeatureFlagEntry"("userId", "flag");
