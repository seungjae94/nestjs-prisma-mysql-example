/*
  Warnings:

  - You are about to drop the column `authorName` on the `board` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Board` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `board` DROP FOREIGN KEY `Board_authorName_fkey`;

-- AlterTable
ALTER TABLE `board` DROP COLUMN `authorName`,
    ADD COLUMN `authorId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Board` ADD CONSTRAINT `Board_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
