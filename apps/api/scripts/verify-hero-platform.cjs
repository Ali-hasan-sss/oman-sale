#!/usr/bin/env node
/**
 * Verifies HeroSlide.platform column exists and is returned by Prisma.
 * Run on the server: node apps/api/scripts/verify-hero-platform.cjs
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const column = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'HeroSlide' AND column_name = 'platform'
    `);

    if (column.rowCount === 0) {
      console.error('MISSING: HeroSlide.platform column — run: npm run prisma:deploy');
      process.exit(1);
    }

    const slides = await prisma.heroSlide.findMany({
      select: { id: true, titleAr: true, platform: true },
      take: 5
    });

    console.log('OK: platform column exists');
    console.log(JSON.stringify(slides, null, 2));

    if (slides.length > 0 && slides.every((s) => s.platform === undefined)) {
      console.error('WARN: platform is undefined — run: npm run prisma:generate && pm2 restart oman-sale-api');
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
