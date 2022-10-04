/*
  Warnings:

  - You are about to drop the column `dispatch_date_time` on the `captures` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "captures" DROP COLUMN "dispatch_date_time",
ADD COLUMN     "img_dispatch_date_time" TIMESTAMP(6),
ADD COLUMN     "json_dispatch_date_time" TIMESTAMP(6);
