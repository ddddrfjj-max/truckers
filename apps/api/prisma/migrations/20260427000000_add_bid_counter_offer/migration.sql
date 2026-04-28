-- Add COUNTERED to BidStatus (idempotent — safe to run even if already applied)
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'COUNTERED';

-- Add counter-offer columns to bids (IF NOT EXISTS prevents duplicate-column errors)
ALTER TABLE "bids"
  ADD COLUMN IF NOT EXISTS "counterAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "counterNote"   TEXT,
  ADD COLUMN IF NOT EXISTS "counterBy"     TEXT;
