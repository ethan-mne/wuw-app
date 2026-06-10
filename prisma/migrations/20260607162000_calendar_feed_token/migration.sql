-- AlterTable
ALTER TABLE `user`
    ADD COLUMN `calendarFeedToken` VARCHAR(128) NULL,
    ADD COLUMN `calendarFeedTokenCreatedAt` DATETIME(3) NULL,
    ADD COLUMN `calendarFeedTokenRevokedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_calendarFeedToken_key` ON `user`(`calendarFeedToken`);
