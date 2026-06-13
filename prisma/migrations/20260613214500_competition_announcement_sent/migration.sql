-- CreateTable
CREATE TABLE `competition_announcement_sent` (
    `id` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NOT NULL,
    `sentByUserId` VARCHAR(191) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `competition_announcement_sent_competitionId_key`(`competitionId`),
    INDEX `competition_announcement_sent_sentByUserId_idx`(`sentByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
