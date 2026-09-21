/*
  Warnings:

  - You are about to drop the column `searchVector` on the `Place` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Place_searchVector_idx";

-- AlterTable
ALTER TABLE "Place" DROP COLUMN "searchVector";
