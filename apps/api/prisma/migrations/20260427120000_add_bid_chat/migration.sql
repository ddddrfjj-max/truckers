-- Make bookingId nullable so chat messages can belong to a bid instead of a booking
ALTER TABLE "chat_messages" ALTER COLUMN "bookingId" DROP NOT NULL;

-- Add bid-chat fields
ALTER TABLE "chat_messages"
  ADD COLUMN "bidId"       TEXT,
  ADD COLUMN "messageType" TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN "offerAmount" DOUBLE PRECISION,
  ADD COLUMN "offerStatus" TEXT;

-- FK: chat_messages.bidId → bids.id (cascade on bid delete)
ALTER TABLE "chat_messages"
  ADD CONSTRAINT "chat_messages_bidId_fkey"
  FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE;
