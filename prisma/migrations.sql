-- CodeExample tablosunu oluştur
CREATE TABLE "code_examples" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "context" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "successful" BOOLEAN NOT NULL,
    "output" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_examples_pkey" PRIMARY KEY ("id")
);

-- İndeksler
CREATE INDEX "code_examples_successful_idx" ON "code_examples"("successful");
CREATE INDEX "code_examples_language_idx" ON "code_examples"("language");
CREATE INDEX "code_examples_createdAt_idx" ON "code_examples"("createdAt" DESC);