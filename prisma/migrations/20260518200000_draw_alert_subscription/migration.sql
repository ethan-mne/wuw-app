-- CreateTable
CREATE TABLE `draw_alert_subscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `draw_alert_subscription_userId_competitionId_key`(`userId`, `competitionId`),
    INDEX `draw_alert_subscription_userId_idx`(`userId`),
    INDEX `draw_alert_subscription_competitionId_idx`(`competitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
