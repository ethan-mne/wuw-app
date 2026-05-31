-- PlanetScale production deploy: push devices + draw reminders + draw alerts
-- Apply via a deploy request (see prisma/README-planetscale-deploy.md).
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS `user_push_device` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `platform` ENUM('android', 'ios') NOT NULL,
    `apnsEnvironment` ENUM('sandbox', 'production') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `user_push_device_token_key`(`token`),
    INDEX `user_push_device_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `draw_reminder_sent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `draw_reminder_sent_userId_competitionId_key`(`userId`, `competitionId`),
    INDEX `draw_reminder_sent_userId_idx`(`userId`),
    INDEX `draw_reminder_sent_competitionId_idx`(`competitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `draw_alert_subscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `competitionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `draw_alert_subscription_userId_competitionId_key`(`userId`, `competitionId`),
    INDEX `draw_alert_subscription_userId_idx`(`userId`),
    INDEX `draw_alert_subscription_competitionId_idx`(`competitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- iOS APNs: sandbox vs production routing (required for TestFlight + Xcode debug tokens).
-- PlanetScale: apply via deploy request on a branch, not direct DDL on main.
ALTER TABLE `user_push_device`
    ADD COLUMN `apnsEnvironment` ENUM('sandbox', 'production') NULL;
