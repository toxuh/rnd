/*
  Warnings:

  - Added the required column `keyPreview` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `api_keys` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_userId_fkey";

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "keyPreview" TEXT NOT NULL,
ADD COLUMN     "lastRequestAt" TIMESTAMP(3),
ADD COLUMN     "maxRequests" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "totalRequests" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "rateLimit" SET DEFAULT 100,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;

-- CreateTable
CREATE TABLE "api_key_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxKeysPerUser" INTEGER NOT NULL DEFAULT 10,
    "defaultRateLimit" INTEGER NOT NULL DEFAULT 100,
    "maxRateLimit" INTEGER NOT NULL DEFAULT 1000,
    "defaultMaxRequests" INTEGER NOT NULL DEFAULT 10000,
    "allowedEndpoints" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_policies_name_key" ON "api_key_policies"("name");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
