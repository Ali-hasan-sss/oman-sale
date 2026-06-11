/**
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function seedStorePlans(prisma) {
  const rootCategories = await prisma.category.findMany({
    where: { parentId: null, deletedAt: null },
    select: { id: true }
  });

  if (rootCategories.length === 0) {
    return;
  }

  const promotionByName = Object.fromEntries(
    (
      await prisma.promotionPlan.findMany({
        where: { name: { in: ['featured', 'super-featured', 'full-featured'] } },
        select: { id: true, name: true }
      })
    ).map((plan) => [plan.name, plan.id])
  );

  const plans = [
    {
      nameAr: 'الخطة الأساسية',
      nameEn: 'Basic Plan',
      sortOrder: 0,
      promotionPlanId: null,
      descriptionAr: [
        'صفحة متجر مخصصة بهوية علامتك',
        'نشر وإدارة العروض ضمن الحد المسموح',
        'ظهور في نتائج البحث والفئات',
        'تجربة مجانية 7 أيام مع 10 عروض',
        'دعم فني عبر البريد الإلكتروني'
      ].join('\n'),
      descriptionEn: [
        'Dedicated store page with your branding',
        'Publish and manage listings within your plan limit',
        'Visibility in search results and categories',
        '7-day free trial with 10 listings',
        'Email support'
      ].join('\n'),
      pricing: [
        { billingPeriod: 'ONE_MONTH', price: 20, maxListings: 25 },
        { billingPeriod: 'TWO_MONTHS', price: 38, maxListings: 50 },
        { billingPeriod: 'THREE_MONTHS', price: 54, maxListings: 75 }
      ]
    },
    {
      nameAr: 'الخطة الاحترافية',
      nameEn: 'Professional Plan',
      sortOrder: 1,
      promotionPlanId: promotionByName.featured ?? null,
      descriptionAr: [
        'كل مميزات الخطة الأساسية',
        'تمييز تلقائي لإعلانات المتجر',
        'حد عروض أعلى للنمو السريع',
        'أولوية في نتائج البحث',
        'تجربة مجانية 7 أيام مع 10 عروض',
        'دعم فني بأولوية أعلى'
      ].join('\n'),
      descriptionEn: [
        'Everything in the Basic plan',
        'Automatic promotion on store listings',
        'Higher listing limits for faster growth',
        'Priority in search results',
        '7-day free trial with 10 listings',
        'Priority support'
      ].join('\n'),
      pricing: [
        { billingPeriod: 'ONE_MONTH', price: 60, maxListings: 75 },
        { billingPeriod: 'TWO_MONTHS', price: 114, maxListings: 150 },
        { billingPeriod: 'THREE_MONTHS', price: 162, maxListings: 225 }
      ]
    },
    {
      nameAr: 'خطة الترا',
      nameEn: 'Ultra Plan',
      sortOrder: 2,
      promotionPlanId: promotionByName['super-featured'] ?? promotionByName['full-featured'] ?? null,
      descriptionAr: [
        'كل مميزات الخطة الاحترافية',
        'أعلى حد للعروض والوصول',
        'تمييز قوي في الصفحات الرئيسية',
        'دعم مخصص سريع الاستجابة',
        'تجربة مجانية 7 أيام مع 10 عروض',
        'مراجعة ونشر أسرع للعروض'
      ].join('\n'),
      descriptionEn: [
        'Everything in the Professional plan',
        'Maximum listing limits and reach',
        'Strong featured placement on main pages',
        'Dedicated fast-response support',
        '7-day free trial with 10 listings',
        'Faster listing review and publishing'
      ].join('\n'),
      pricing: [
        { billingPeriod: 'ONE_MONTH', price: 100, maxListings: 150 },
        { billingPeriod: 'TWO_MONTHS', price: 190, maxListings: 300 },
        { billingPeriod: 'THREE_MONTHS', price: 270, maxListings: 450 }
      ]
    }
  ];

  const seededPlanNames = plans.map((plan) => plan.nameEn);

  await prisma.storeSubscriptionPlan.updateMany({
    where: {
      deletedAt: null,
      nameEn: { notIn: seededPlanNames }
    },
    data: { isActive: false, deletedAt: new Date() }
  });

  for (const planDef of plans) {
    const existing = await prisma.storeSubscriptionPlan.findFirst({
      where: { nameEn: planDef.nameEn, deletedAt: null }
    });

    const planData = {
      nameAr: planDef.nameAr,
      nameEn: planDef.nameEn,
      descriptionAr: planDef.descriptionAr,
      descriptionEn: planDef.descriptionEn,
      sortOrder: planDef.sortOrder,
      trialDays: 7,
      trialMaxListings: 10,
      promotionPlanId: planDef.promotionPlanId,
      isActive: true,
      deletedAt: null
    };

    const plan = existing
      ? await prisma.storeSubscriptionPlan.update({
          where: { id: existing.id },
          data: planData
        })
      : await prisma.storeSubscriptionPlan.create({ data: planData });

    for (const category of rootCategories) {
      for (const row of planDef.pricing) {
        await prisma.storePlanPricing.upsert({
          where: {
            planId_categoryId_billingPeriod: {
              planId: plan.id,
              categoryId: category.id,
              billingPeriod: row.billingPeriod
            }
          },
          update: {
            price: row.price,
            maxListings: row.maxListings,
            deletedAt: null
          },
          create: {
            planId: plan.id,
            categoryId: category.id,
            billingPeriod: row.billingPeriod,
            price: row.price,
            maxListings: row.maxListings
          }
        });
      }
    }
  }
}

module.exports = { seedStorePlans };
