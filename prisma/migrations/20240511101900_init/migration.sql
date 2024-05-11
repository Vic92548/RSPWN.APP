/*
  Warnings:

  - The primary key for the `Follow` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `Follow` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`creatorId`, `followerId`);
