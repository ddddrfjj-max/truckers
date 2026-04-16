-- Add new document types
ALTER TYPE "DocumentType" ADD VALUE 'GOVERNMENT_ID';
ALTER TYPE "DocumentType" ADD VALUE 'BUSINESS_LICENSE';

-- CreateTable for contact messages
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);
