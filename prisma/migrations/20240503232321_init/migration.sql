/*
  Warnings:

  - Added the required column `link` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Post` ADD COLUMN `link` VARCHAR(191) NOT NULL;
