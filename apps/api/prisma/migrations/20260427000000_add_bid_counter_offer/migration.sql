-- AlterEnum
ALTER TYPE "BidStatus" ADD VALUE 'COUNTERED';

-- AlterTable
ALTER TABLE "bids" ADD COLUMN "counterAmount" DOUBLE PRECISION,
ADD COLUMN "counterNote" TEXT,
ADD COLUMN "counterBy" TEXT;
