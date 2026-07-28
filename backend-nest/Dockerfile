FROM node:20

WORKDIR /app

# Copiar dependencias
COPY package.json package-lock.json ./
RUN npm install

# Copiar código fuente
COPY tsconfig.json tsconfig.build.json nest-cli.json prisma.config.ts ./
COPY src/ src/
COPY prisma/ prisma/

# Generar cliente Prisma y compilar
RUN npx prisma generate && npm run build && cp -r src/generated dist/src/generated

EXPOSE 3000

# Ejecutar migraciones y arrancar
CMD npx prisma migrate deploy && node dist/src/main.js