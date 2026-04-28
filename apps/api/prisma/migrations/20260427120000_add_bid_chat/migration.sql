-- Make bookingId nullable (idempotent — only drops NOT NULL if it is currently NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'chat_messages'
      AND column_name  = 'bookingId'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE "chat_messages" ALTER COLUMN "bookingId" DROP NOT NULL;
  END IF;
END $$;

-- Add bid-chat columns (IF NOT EXISTS prevents duplicate-column errors on retry)
ALTER TABLE "chat_messages"
  ADD COLUMN IF NOT EXISTS "bidId"       TEXT,
  ADD COLUMN IF NOT EXISTS "messageType" TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS "offerAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "offerStatus" TEXT;

-- Add FK constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name   = 'chat_messages_bidId_fkey'
      AND table_name        = 'chat_messages'
  ) THEN
    ALTER TABLE "chat_messages"
      ADD CONSTRAINT "chat_messages_bidId_fkey"
      FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE;
  END IF;
END $$;
