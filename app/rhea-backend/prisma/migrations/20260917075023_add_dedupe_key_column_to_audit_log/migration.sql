/*
  Warnings:

  - A unique constraint covering the columns `[userId,action,dedupeKey]` on the table `AuditLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_userId_action_dedupeKey_key" ON "AuditLog"("userId", "action", "dedupeKey");
