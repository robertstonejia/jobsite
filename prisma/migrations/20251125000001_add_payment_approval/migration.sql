-- CreateTable
CREATE TABLE "payment_approvals" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_approvals_token_key" ON "payment_approvals"("token");

-- CreateIndex
CREATE INDEX "payment_approvals_token_idx" ON "payment_approvals"("token");

-- CreateIndex
CREATE INDEX "payment_approvals_paymentId_idx" ON "payment_approvals"("paymentId");

-- AddForeignKey
ALTER TABLE "payment_approvals" ADD CONSTRAINT "payment_approvals_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
