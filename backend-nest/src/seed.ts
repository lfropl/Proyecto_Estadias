import { PrismaClient } from './generated/prisma';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const prisma = new PrismaClient();

  const email = 'admin@demo.com';
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 12);

  const exists = await prisma.usuario.findUnique({ where: { email } });

  if (exists) {
    console.log(`Usuario demo ya existe: ${email}`);
  } else {
    await prisma.usuario.create({
      data: {
        email,
        nombre: 'Admin',
        apellido: 'Sistema',
        password: hashedPassword,
        puesto: 'Administrador',
        activo: true,
      },
    });
    console.log(`Usuario demo creado: ${email} / ${password}`);
  }

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});