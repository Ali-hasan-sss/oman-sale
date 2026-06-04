const bcrypt = require('bcryptjs');

const { getCategoryDefinitions } = require('./seed-categories.cjs');
const { DEMO_LISTING_CONTENT } = require('./seed-listings-data.cjs');

const OMAN_CITIES = ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'البريمي', 'الرستاق', 'السيب', 'الخوير', 'القرم'];
const AREAS = ['السيب', 'الخوير', 'القرم', 'الغبرة', 'المعبيلة', 'العذيبة', 'مدينة قابوس', 'الموالح'];

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function seedListings(prisma) {
  const password = await bcrypt.hash('Demo12345', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@omansale.local' },
    update: {
      fullName: 'بائع تجريبي',
      phone: '+96890000099',
      isVerified: true,
      deletedAt: null
    },
    create: {
      fullName: 'بائع تجريبي',
      email: 'demo@omansale.local',
      password,
      phone: '+96890000099',
      role: 'USER',
      isVerified: true
    }
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }]
  });

  const categoryDefs = getCategoryDefinitions();
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));

  const missingCategories = categoryDefs
    .map((def) => def.slug)
    .filter((slug) => !categoriesBySlug.has(slug));

  if (missingCategories.length) {
    console.warn(`Skipping demo listings for categories not in DB: ${missingCategories.join(', ')}`);
  }

  const missingContent = categoryDefs
    .map((def) => def.slug)
    .filter((slug) => !DEMO_LISTING_CONTENT[slug]);

  if (missingContent.length) {
    throw new Error(`Missing demo listing content for categories: ${missingContent.join(', ')}`);
  }

  let created = 0;
  let skipped = 0;

  for (const [index, def] of categoryDefs.entries()) {
    const category = categoriesBySlug.get(def.slug);
    if (!category) continue;

    const adSlug = `demo-${category.slug}`;
    const existing = await prisma.ad.findUnique({ where: { slug: adSlug } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const content = DEMO_LISTING_CONTENT[def.slug];
    const city = OMAN_CITIES[index % OMAN_CITIES.length];
    const area = AREAS[index % AREAS.length];
    const views = 50 + (index * 17) % 450;

    await prisma.ad.create({
      data: {
        title: content.titleAr,
        slug: adSlug,
        description: content.descriptionAr,
        type: category.type,
        condition: content.condition ?? null,
        price: content.price ?? null,
        currency: 'OMR',
        city,
        area,
        contactPhone: demoUser.phone,
        status: 'ACTIVE',
        isApproved: true,
        isActive: true,
        isSold: false,
        approvedAt: new Date(),
        views,
        userId: demoUser.id,
        categoryId: category.id,
        images: {
          create: content.images.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder }))
        }
      }
    });

    created += 1;
  }

  console.log(`Seeded demo listings: ${created} created, ${skipped} already existed (${categoryDefs.length} category definitions)`);
}

module.exports = { seedListings };
