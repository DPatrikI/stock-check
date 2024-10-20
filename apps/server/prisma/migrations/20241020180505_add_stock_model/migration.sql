/*
  Warnings:

  - You are about to drop the `StockPrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "StockPrice";

-- CreateTable
CREATE TABLE "Stock" (
    "symbol" TEXT NOT NULL,
    "prices" JSONB NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("symbol")
);
