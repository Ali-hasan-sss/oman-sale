const path = require('node:path');

const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('Admin12345', 12);

  await prisma.user.upsert({
    where: { email: 'admin@omansale.local' },
    update: {},
    create: {
      fullName: 'Oman Sale Admin',
      email: 'admin@omansale.local',
      password,
      role: 'ADMIN',
      isVerified: true
    }
  });

  const heroCount = await prisma.heroSlide.count();
  if (heroCount === 0) {
    await prisma.heroSlide.createMany({
      data: [
        {
          sortOrder: 0,
          imageUrl:
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop',
          titleAr: 'اكتشف أفضل الصفقات في عمان',
          titleEn: 'Discover the best deals in Oman',
          subtitleAr: 'منصة موحدة للمنتجات والخدمات والوظائف وكل أنواع الإعلانات',
          subtitleEn: 'One marketplace for products, services, jobs and every listing type',
          buttonLabelAr: 'ابدأ التصفح',
          buttonLabelEn: 'Start browsing',
          buttonLink: '/all-listings'
        },
        {
          sortOrder: 1,
          imageUrl:
            'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1600&h=900&fit=crop',
          titleAr: 'سيارات للبيع',
          titleEn: 'Cars for sale',
          subtitleAr: 'اعثر على سيارتك القادمة من بائعين موثوقين في كل المحافظات',
          subtitleEn: 'Find your next car from trusted sellers across all governorates',
          buttonLabelAr: 'استكشف السيارات',
          buttonLabelEn: 'Explore cars',
          buttonLink: '/all-listings'
        },
        {
          sortOrder: 2,
          imageUrl:
            'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=900&fit=crop',
          titleAr: 'فرص وظيفية متميزة',
          titleEn: 'Outstanding job opportunities',
          subtitleAr: 'وظائف شاغرة وطلبات توظيف ضمن تجربة بحث سهلة وسريعة',
          subtitleEn: 'Vacancies and job requests with a simple, fast search experience',
          buttonLabelAr: 'شاهد الوظائف',
          buttonLabelEn: 'View jobs',
          buttonLink: '/all-listings'
        },
        {
          sortOrder: 3,
          imageUrl:
            'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&h=900&fit=crop',
          titleAr: 'خدمات موثوقة ومتنوعة',
          titleEn: 'Trusted services',
          subtitleAr: 'احصل على أفضل الخدمات من مزودين معتمدين في سلطنة عمان',
          subtitleEn: 'Get high-quality services from verified providers in Oman',
          buttonLabelAr: 'استكشف الخدمات',
          buttonLabelEn: 'Explore services',
          buttonLink: '/all-listings'
        }
      ]
    });
  }

  const { seedCategories } = require('./seed-categories.cjs');
  await seedCategories(prisma);

  const { seedStoreTypes } = require('./seed-store-types.cjs');
  await seedStoreTypes(prisma);

  const { seedListings } = require('./seed-listings.cjs');
  await seedListings(prisma);

  await prisma.promotionPlan.updateMany({
    where: { name: { in: ['Bronze', 'Silver', 'Gold', 'Platinum'] } },
    data: { isActive: false, deletedAt: new Date() }
  });

  const promotionPlans = [
    {
      name: 'normal',
      nameAr: 'إعلان عادي',
      nameEn: 'Normal Ad',
      descriptionAr: 'ظهور عادي ضمن نتائج البحث والفئات.',
      descriptionEn: 'Standard visibility across search results and categories.',
      pricePerDay: 0,
      weekPrice: 0,
      twoWeeksPrice: 0,
      monthPrice: 0,
      priorityScore: 0,
      dailyImpressions: 300,
      badgeLabel: 'عادي',
      color: '#64748b'
    },
    {
      name: 'featured',
      nameAr: 'إعلان مميز',
      nameEn: 'Featured Ad',
      descriptionAr: 'ظهور أفضل مع وسم ترويجي واضح.',
      descriptionEn: 'Better visibility with a clear promotion badge.',
      pricePerDay: 1,
      weekPrice: 5,
      twoWeeksPrice: 9,
      monthPrice: 18,
      priorityScore: 25,
      dailyImpressions: 1500,
      badgeLabel: 'مميز',
      color: '#f59e0b'
    },
    {
      name: 'super-featured',
      nameAr: 'إعلان مميز جدا',
      nameEn: 'Super Featured Ad',
      descriptionAr: 'أولوية عالية وظهور أقوى في الصفحات الرئيسية.',
      descriptionEn: 'High priority and stronger placement across main pages.',
      pricePerDay: 2,
      weekPrice: 10,
      twoWeeksPrice: 18,
      monthPrice: 35,
      priorityScore: 60,
      dailyImpressions: 4000,
      appearsFirst: true,
      badgeLabel: 'مميز جدا',
      color: '#16a34a'
    },
    {
      name: 'full-featured',
      nameAr: 'إعلان كامل التميز',
      nameEn: 'Fully Featured Ad',
      descriptionAr: 'أعلى مستوى ترويج مع أولوية قصوى وظهور أول.',
      descriptionEn: 'Top promotion level with maximum priority and first placement.',
      pricePerDay: 3,
      weekPrice: 15,
      twoWeeksPrice: 27,
      monthPrice: 50,
      priorityScore: 100,
      dailyImpressions: 10000,
      appearsFirst: true,
      badgeLabel: 'كامل التميز',
      color: '#7c3aed'
    }
  ];

  for (const plan of promotionPlans) {
    await prisma.promotionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
  }

  const { seedStorePlans } = require('./seed-store-plans.cjs');
  await seedStorePlans(prisma);

  const tourismDestinations = [
    ['sultan-qaboos-grand-mosque', 'جامع السلطان قابوس الأكبر', 'Sultan Qaboos Grand Mosque', 'https://images.unsplash.com/photo-1591604129842-1a784c5db2f1?w=400&h=300&fit=crop', 'من أكتوبر إلى أبريل', 'October to April', 'مسقط، سلطنة عمان', 'Muscat, Sultanate of Oman'],
    ['wadi-shab', 'وادي شاب', 'Wadi Shab', 'https://images.unsplash.com/photo-1584469125998-50c49c0d2261?w=400&h=300&fit=crop', 'من أكتوبر إلى مارس', 'October to March', 'ولاية صور، سلطنة عمان', 'Sur, Sultanate of Oman'],
    ['wahiba-sands', 'رمال وهيبة', 'Wahiba Sands', 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=400&h=300&fit=crop', 'من نوفمبر إلى فبراير', 'November to February', 'شمال الشرقية، سلطنة عمان', 'North Sharqiyah, Sultanate of Oman'],
    ['dahariz-lagoon', 'خور الدهاريز', 'Dahariz Lagoon', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 'من يونيو إلى سبتمبر', 'June to September', 'صلالة، سلطنة عمان', 'Salalah, Sultanate of Oman'],
    ['nizwa-fort', 'قلعة نزوى', 'Nizwa Fort', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop', 'من أكتوبر إلى أبريل', 'October to April', 'نزوى، سلطنة عمان', 'Nizwa, Sultanate of Oman'],
    ['qurum-natural-beach', 'شاطئ القرم الطبيعي', 'Qurum Natural Beach', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 'من أكتوبر إلى أبريل', 'October to April', 'القرم، مسقط', 'Qurum, Muscat'],
    ['jebel-shams', 'جبل شمس', 'Jebel Shams', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 'من سبتمبر إلى مايو', 'September to May', 'الداخلية، سلطنة عمان', 'Ad Dakhiliyah, Sultanate of Oman'],
    ['al-hoota-cave', 'كهف الهوتة', 'Al Hoota Cave', 'https://images.unsplash.com/photo-1508433957232-3107f5fd5995?w=400&h=300&fit=crop', 'طوال العام', 'Year-round', 'الحمراء، سلطنة عمان', 'Al Hamra, Sultanate of Oman']
  ];

  const articleCategories = [
    ['economy', 'اقتصاد', 'Economy'],
    ['technology', 'تقانة', 'Technology'],
    ['health', 'صحة', 'Health'],
    ['sports', 'رياضة', 'Sports'],
    ['culture', 'ثقافة', 'Culture'],
    ['education', 'تعليم', 'Education'],
    ['lifestyle', 'حياة', 'Lifestyle'],
    ['travel', 'سفر', 'Travel']
  ];

  const categoryIds = {};
  for (const [index, category] of articleCategories.entries()) {
    const [slug, nameAr, nameEn] = category;
    const record = await prisma.articleCategory.upsert({
      where: { slug },
      update: { nameAr, nameEn, sortOrder: index },
      create: { slug, nameAr, nameEn, sortOrder: index }
    });
    categoryIds[slug] = record.id;
  }

  const seededArticles = [
    {
      slug: 'oman-digital-economy-growth',
      categorySlug: 'economy',
      titleAr: 'نمو الاقتصاد الرقمي في عُمان يفتح آفاقًا جديدة',
      titleEn: 'Oman’s digital economy growth opens new horizons',
      coverImageUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=800&fit=crop'
      ],
      bodyAr:
        '<p>يشهد الاقتصاد الرقمي في سلطنة عُمان تسارعًا ملحوظًا مع دعم الحكومة للتحول الرقمي 🚀</p><p>تستثمر الشركات المحلية في التجارة الإلكترونية والمدفوعات الرقمية، ما يخلق فرصًا جديدة للشباب العُماني.</p><ul><li>نمو التجارة الإلكترونية</li><li>توسع الخدمات المالية الرقمية</li><li>دعم رواد الأعمال</li></ul>',
      bodyEn:
        '<p>Oman’s digital economy is accelerating as the government backs national digital transformation 🚀</p><p>Local companies are investing in e-commerce and digital payments, creating fresh opportunities for Omani youth.</p><ul><li>E-commerce growth</li><li>Expanding digital financial services</li><li>Entrepreneurship support</li></ul>'
    },
    {
      slug: 'smart-cities-oman-tech',
      categorySlug: 'technology',
      titleAr: 'المدن الذكية في عُمان: مستقبل الخدمات الحضرية',
      titleEn: 'Smart cities in Oman: the future of urban services',
      coverImageUrl:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=675&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=800&fit=crop'
      ],
      bodyAr:
        '<p>تتبنى عُمان مشاريع المدن الذكية لتحسين جودة الحياة في المدن الكبرى 💡</p><p>من أنظمة النقل الذكي إلى إدارة الطاقة، تُحدث التقنية فرقًا حقيقيًا في الخدمات اليومية.</p><p><strong>أبرز المجالات:</strong> النقل، الطاقة، الأمن، والخدمات البلدية.</p>',
      bodyEn:
        '<p>Oman is adopting smart city projects to improve quality of life in major urban centers 💡</p><p>From intelligent transport to energy management, technology is making a real difference in everyday services.</p><p><strong>Key areas:</strong> transport, energy, safety, and municipal services.</p>'
    },
    {
      slug: 'wellness-lifestyle-oman',
      categorySlug: 'lifestyle',
      titleAr: 'أسلوب حياة متوازن: صحة وعافية في عُمان',
      titleEn: 'Balanced living: health and wellness in Oman',
      coverImageUrl:
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=675&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=800&fit=crop'
      ],
      bodyAr:
        '<p>يتجه الكثيرون في عُمان نحو أسلوب حياة أكثر توازنًا يجمع بين العمل والراحة 🧘‍♂️</p><p>المشي على الشاطئ، الرياضة المنزلية، والتغذية الصحية أصبحت جزءًا من الروتين اليومي.</p><p>❤️ الاهتمام بالصحة النفسية والجسدية أصبح أولوية للعائلات العُمانية.</p>',
      bodyEn:
        '<p>Many people in Oman are embracing a more balanced lifestyle that blends work and rest 🧘‍♂️</p><p>Beach walks, home workouts, and healthy eating are becoming part of daily routines.</p><p>❤️ Mental and physical wellness is now a priority for Omani families.</p>'
    },
    {
      slug: 'explore-oman-travel-guide',
      categorySlug: 'travel',
      titleAr: 'دليل سريع لاستكشاف جمال عُمان الطبيعي',
      titleEn: 'A quick guide to exploring Oman’s natural beauty',
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop',
      galleryImages: [
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop'
      ],
      bodyAr:
        '<p>من الجبال الشاهقة إلى الشواطئ الهادئة، تقدم عُمان تجارب سفر لا تُنسى 🏔️🌊</p><p>سواء كنت تحب المغامرة أو الاسترخاء، ستجد وجهة تناسبك في كل محافظة.</p><ol><li>جبل شمس ووادي غول</li><li>صحراء الشرقية</li><li>شواطئ مسقط والقرم</li></ol>',
      bodyEn:
        '<p>From towering mountains to calm beaches, Oman offers unforgettable travel experiences 🏔️🌊</p><p>Whether you love adventure or relaxation, you will find a destination that suits you in every governorate.</p><ol><li>Jebel Shams and Wadi Ghul</li><li>Eastern desert landscapes</li><li>Muscat and Qurum beaches</li></ol>'
    }
  ];

  for (const article of seededArticles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        titleAr: article.titleAr,
        titleEn: article.titleEn,
        bodyAr: article.bodyAr,
        bodyEn: article.bodyEn,
        coverImageUrl: article.coverImageUrl,
        galleryImages: article.galleryImages,
        categoryId: categoryIds[article.categorySlug],
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      create: {
        slug: article.slug,
        titleAr: article.titleAr,
        titleEn: article.titleEn,
        bodyAr: article.bodyAr,
        bodyEn: article.bodyEn,
        coverImageUrl: article.coverImageUrl,
        galleryImages: article.galleryImages,
        categoryId: categoryIds[article.categorySlug],
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });
  }

  for (const [index, destination] of tourismDestinations.entries()) {
    const [slug, titleAr, titleEn, imageUrl, bestTimeAr, bestTimeEn, addressAr, addressEn] = destination;
    await prisma.tourismDestination.upsert({
      where: { slug },
      update: {
        sortOrder: index,
        imageUrl,
        titleAr,
        titleEn,
        bestTimeAr,
        bestTimeEn,
        addressAr,
        addressEn
      },
      create: {
        slug,
        sortOrder: index,
        imageUrl,
        galleryImages: [],
        titleAr,
        titleEn,
        rating: '4.9',
        ratingLabelAr: 'تقييم ممتاز',
        ratingLabelEn: 'Excellent rating',
        aboutAr: `${titleAr} من أبرز الوجهات السياحية في سلطنة عمان، ويجمع بين الجمال الطبيعي والهوية العمانية الأصيلة ليمنح الزائر تجربة لا تنسى.`,
        aboutEn: `${titleEn} is one of Oman’s standout tourism destinations, blending natural beauty with authentic Omani character for a memorable visit.`,
        highlightsAr: ['مناظر طبيعية مميزة', 'تجربة ثقافية عمانية', 'مواقع تصوير رائعة', 'أجواء مناسبة للعائلات'],
        highlightsEn: ['Distinctive landscapes', 'Omani cultural experience', 'Great photo spots', 'Family-friendly atmosphere'],
        activitiesAr: ['استكشاف المكان سيراً على الأقدام', 'التقاط الصور التذكارية', 'زيارة الأسواق والمناطق القريبة', 'الاستمتاع بالأجواء الطبيعية'],
        activitiesEn: ['Explore the area on foot', 'Take memorable photos', 'Visit nearby markets and areas', 'Enjoy the natural atmosphere'],
        bestTimeAr,
        bestTimeEn,
        addressAr,
        addressEn
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
