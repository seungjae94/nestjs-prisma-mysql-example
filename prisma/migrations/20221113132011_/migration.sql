/*
  Warnings:

  - Added the required column `authorName` to the `Board` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `board` ADD COLUMN `authorName` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Board` ADD CONSTRAINT `Board_authorName_fkey` FOREIGN KEY (`authorName`) REFERENCES `User`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
