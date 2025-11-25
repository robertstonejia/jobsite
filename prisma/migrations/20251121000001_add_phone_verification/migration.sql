-- AlterTable
ALTER TABLE "email_verifications"
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN "phoneNumber" TEXT,
  ADD COLUMN "verificationType" TEXT NOT NULL DEFAULT 'email';
