const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Default categories
  const categories = [
    { name: 'Uncategorized', isDefault: true },
    { name: 'Food & Dining' },
    { name: 'Transport' },
    { name: 'Housing' },
    { name: 'Healthcare' },
    { name: 'Entertainment' },
    { name: 'Shopping' },
    { name: 'Education' },
    { name: 'Utilities' },
    { name: 'Other' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log('Categories seeded')

  // Admin user
  const hashed = await bcrypt.hash('Admin@1234', 10)
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      password: hashed,
      name: 'Huncho',
      role: 'ADMIN',
    },
  })
  console.log('Admin user seeded — email: admin@gmail.com / password: Admin@1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
