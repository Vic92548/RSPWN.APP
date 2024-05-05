-- CreateTable
CREATE TABLE `Follow` (
    `postId` VARCHAR(191) NOT NULL,
    `followerId` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,

    PRIMARY KEY (`postId`, `followerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
