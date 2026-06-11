const path = require('node:path');
const dotenv = require('dotenv');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: false });
const prisma = new PrismaClient({ adapter });

async function main() {
  const publishedWhere = {
    deletedAt: null,
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() }
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({ where: publishedWhere, take: 20 }),
    prisma.article.count({ where: publishedWhere })
  ]);

  console.log('DATABASE_URL', process.env.DATABASE_URL);
  console.log('total', total);
  console.log('slugs', items.map((item) => item.slug));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
