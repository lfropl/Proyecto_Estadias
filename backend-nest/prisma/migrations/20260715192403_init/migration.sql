-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "puesto" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "numeroEconomico" TEXT NOT NULL,
    "placas" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tipoCaja" TEXT,
    "vencimientoSeguro" TEXT,
    "aseguradora" TEXT,
    "polizaSeguro" TEXT,
    "folioVerificacion" TEXT,
    "vencimientoVerificacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "curp" TEXT NOT NULL,
    "nss" TEXT NOT NULL,
    "infonavit" TEXT,
    "fechaIngreso" TEXT NOT NULL,
    "salarioDiario" DOUBLE PRECISION NOT NULL,
    "tipoContrato" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'Operador',
    "estatus" TEXT NOT NULL DEFAULT 'activo',
    "folioAptoMedico" TEXT,
    "vencimientoAptoMedico" TEXT,
    "folioLicencia" TEXT,
    "vencimientoLicencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "direccionFiscal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viaje" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "nota" TEXT,
    "estatus" TEXT NOT NULL DEFAULT 'amarillo',
    "etaCarga" TEXT NOT NULL,
    "llegadaCarga" TEXT,
    "ingresoCarga" TEXT,
    "horaCarga" TEXT,
    "salidaCarga" TEXT,
    "etaDescarga" TEXT,
    "llegadaDescarga" TEXT,
    "ingresoDescarga" TEXT,
    "horaDescarga" TEXT,
    "salidaDescarga" TEXT,
    "referencia" TEXT,
    "observaciones" TEXT,
    "cliente" TEXT,
    "clienteId" TEXT,
    "cobranzaTerminada" BOOLEAN NOT NULL DEFAULT false,
    "creadorId" TEXT NOT NULL,

    CONSTRAINT "Viaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoleccionSeguimiento" (
    "id" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "etaCarga" TEXT,
    "llegadaCarga" TEXT,
    "ingresoCarga" TEXT,
    "horaCarga" TEXT,
    "salidaCarga" TEXT,
    "etaDescarga" TEXT,
    "llegadaDescarga" TEXT,
    "ingresoDescarga" TEXT,
    "horaDescarga" TEXT,
    "salidaDescarga" TEXT,
    "viajeId" TEXT NOT NULL,

    CONSTRAINT "RecoleccionSeguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioViaje" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fechaIso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,
    "viajeId" TEXT NOT NULL,

    CONSTRAINT "ComentarioViaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchivoViaje" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "base64" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "viajeId" TEXT NOT NULL,

    CONSTRAINT "ArchivoViaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaDatos" (
    "id" TEXT NOT NULL,
    "requiereCartaPorte" BOOLEAN NOT NULL DEFAULT false,
    "folio" TEXT,
    "uuid" TEXT,
    "subtotal" DOUBLE PRECISION,
    "iva" DOUBLE PRECISION,
    "retencionIsr" DOUBLE PRECISION,
    "retencionIva" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "fechaEmision" TEXT,
    "fechaPago" TEXT,
    "metodoPago" TEXT,
    "formaPago" TEXT,
    "estatusFactura" TEXT NOT NULL DEFAULT 'pendiente',
    "observaciones" TEXT,
    "viajeId" TEXT NOT NULL,

    CONSTRAINT "FacturaDatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CobranzaPago" (
    "id" TEXT NOT NULL,
    "metodoPago" TEXT,
    "fechaPago" TEXT,
    "referencia" TEXT,
    "viajeId" TEXT NOT NULL,

    CONSTRAINT "CobranzaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mantenimiento" (
    "id" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehiculoId" TEXT NOT NULL,

    CONSTRAINT "Mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_numeroEconomico_key" ON "Vehiculo"("numeroEconomico");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_placas_key" ON "Vehiculo"("placas");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_rfc_key" ON "Operador"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_curp_key" ON "Operador"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nombre_key" ON "Cliente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaDatos_viajeId_key" ON "FacturaDatos"("viajeId");

-- CreateIndex
CREATE UNIQUE INDEX "CobranzaPago_viajeId_key" ON "CobranzaPago"("viajeId");

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoleccionSeguimiento" ADD CONSTRAINT "RecoleccionSeguimiento_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioViaje" ADD CONSTRAINT "ComentarioViaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioViaje" ADD CONSTRAINT "ComentarioViaje_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoViaje" ADD CONSTRAINT "ArchivoViaje_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaDatos" ADD CONSTRAINT "FacturaDatos_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobranzaPago" ADD CONSTRAINT "CobranzaPago_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
