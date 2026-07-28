/*
  Warnings:

  - Added the required column `updatedAt` to the `Viaje` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Viaje" ADD COLUMN     "costoServicio" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "GastoViaje" (
    "id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaIso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viajeId" TEXT NOT NULL,

    CONSTRAINT "GastoViaje_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GastoViaje" ADD CONSTRAINT "GastoViaje_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
