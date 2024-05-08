-- CreateTable
CREATE TABLE `Reaction` (
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `emoji` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`postId`, `userId`, `timestamp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
