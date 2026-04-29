/*
  Warnings:

  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `firstName` VARCHAR(191) NULL,
    ADD COLUMN `lastName` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `wincoin` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `zipCode` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `coupon` VARCHAR(8) NULL;

-- CreateTable
CREATE TABLE `gift` (
    `order_id` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `fullname` VARCHAR(100) NOT NULL,
    `message` VARCHAR(100) NULL,

    UNIQUE INDEX `gift_order_id_key`(`order_id`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `code` VARCHAR(8) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `discount_rate` FLOAT NOT NULL DEFAULT 0.15,
    `usage_counter` INTEGER NULL DEFAULT 0,

    UNIQUE INDEX `referrals_UN`(`user_id`),
    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
