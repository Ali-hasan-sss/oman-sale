const path = require('node:path');

const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: true });

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

  await prisma.category.createMany({
    data: [
      { name: 'سيارات ومركبات', nameAr: 'سيارات ومركبات', nameEn: 'Cars & Vehicles', slug: 'cars', type: 'PRODUCT', icon: 'car', sortOrder: 10 },
      { name: 'عقارات للبيع', nameAr: 'عقارات للبيع', nameEn: 'Real Estate for Sale', slug: 'real-estate-sale', type: 'PRODUCT', icon: 'building', sortOrder: 20 },
      { name: 'عقارات للإيجار', nameAr: 'عقارات للإيجار', nameEn: 'Real Estate for Rent', slug: 'real-estate-rent', type: 'PRODUCT', icon: 'home', sortOrder: 30 },
      { name: 'إلكترونيات', nameAr: 'إلكترونيات', nameEn: 'Electronics', slug: 'electronics', type: 'PRODUCT', icon: 'monitor', sortOrder: 40 },
      { name: 'الخدمات', nameAr: 'الخدمات', nameEn: 'Services', slug: 'services', type: 'SERVICE', icon: 'wrench', sortOrder: 50 },
      { name: 'وظائف شاغرة', nameAr: 'وظائف شاغرة', nameEn: 'Jobs', slug: 'jobs', type: 'JOB', icon: 'briefcase', sortOrder: 60 },
      { name: 'باحثين عن عمل', nameAr: 'باحثين عن عمل', nameEn: 'Job Seekers', slug: 'job-seekers', type: 'JOB_REQUEST', icon: 'search', sortOrder: 70 },
      { name: 'نقل وتوصيل', nameAr: 'نقل وتوصيل', nameEn: 'Logistics', slug: 'logistics', type: 'LOGISTICS', icon: 'truck', sortOrder: 80 }
    ],
    skipDuplicates: true
  });

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
