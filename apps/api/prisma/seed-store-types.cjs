const storeTypes = [
  { slug: 'car-showroom', nameAr: 'معارض سيارات', nameEn: 'Car showrooms', icon: 'car', sortOrder: 0 },
  { slug: 'real-estate-office', nameAr: 'مكاتب عقارية', nameEn: 'Real estate offices', icon: 'building', sortOrder: 1 },
  { slug: 'grocery-store', nameAr: 'متاجر غذائية', nameEn: 'Grocery stores', icon: 'store', sortOrder: 2 },
  { slug: 'supermarket', nameAr: 'سوبرماركت', nameEn: 'Supermarkets', icon: 'store', sortOrder: 3 },
  { slug: 'spare-parts', nameAr: 'متاجر قطع غيار', nameEn: 'Spare parts stores', icon: 'wrench', sortOrder: 4 },
  { slug: 'auto-workshop', nameAr: 'ورش سيارات', nameEn: 'Auto workshops', icon: 'wrench', sortOrder: 5 },
  { slug: 'clothing-store', nameAr: 'متاجر ملابس', nameEn: 'Clothing stores', icon: 'shirt', sortOrder: 6 },
  { slug: 'cosmetics-beauty', nameAr: 'مواد تجميل وتجميل', nameEn: 'Cosmetics & beauty', icon: 'palette', sortOrder: 7 },
  { slug: 'electronics-shop', nameAr: 'متاجر إلكترونيات', nameEn: 'Electronics shops', icon: 'monitor', sortOrder: 8 },
  { slug: 'mobile-telecom', nameAr: 'اتصالات وموبايل', nameEn: 'Mobile & telecom', icon: 'smartphone', sortOrder: 9 },
  { slug: 'furniture-home', nameAr: 'أثاث ومفروشات', nameEn: 'Furniture & home', icon: 'sofa', sortOrder: 10 },
  { slug: 'home-appliances', nameAr: 'أجهزة منزلية', nameEn: 'Home appliances', icon: 'monitor', sortOrder: 11 },
  { slug: 'pharmacy', nameAr: 'صيدليات', nameEn: 'Pharmacies', icon: 'stethoscope', sortOrder: 12 },
  { slug: 'restaurant-cafe', nameAr: 'مطاعم ومقاهي', nameEn: 'Restaurants & cafes', icon: 'utensils', sortOrder: 13 },
  { slug: 'hardware-tools', nameAr: 'عدد وأدوات', nameEn: 'Hardware & tools', icon: 'hammer', sortOrder: 14 },
  { slug: 'building-materials', nameAr: 'مواد بناء', nameEn: 'Building materials', icon: 'building', sortOrder: 15 },
  { slug: 'jewelry-watches', nameAr: 'مجوهرات وساعات', nameEn: 'Jewelry & watches', icon: 'watch', sortOrder: 16 },
  { slug: 'sports-fitness', nameAr: 'رياضة ولياقة', nameEn: 'Sports & fitness', icon: 'dumbbell', sortOrder: 17 },
  { slug: 'pet-shop', nameAr: 'محلات حيوانات أليفة', nameEn: 'Pet shops', icon: 'paw', sortOrder: 18 },
  { slug: 'bookstore-stationery', nameAr: 'مكتبات ومستلزمات', nameEn: 'Bookstores & stationery', icon: 'book', sortOrder: 19 },
  { slug: 'toys-kids', nameAr: 'ألعاب ومستلزمات أطفال', nameEn: 'Toys & kids', icon: 'baby', sortOrder: 20 },
  { slug: 'optical-shop', nameAr: 'نظارات وبصريات', nameEn: 'Optical shops', icon: 'search', sortOrder: 21 },
  { slug: 'flower-gift', nameAr: 'ورود وهدايا', nameEn: 'Flowers & gifts', icon: 'heart', sortOrder: 22 },
  { slug: 'travel-tourism', nameAr: 'سفر وسياحة', nameEn: 'Travel & tourism', icon: 'plane', sortOrder: 23 },
  { slug: 'medical-clinic', nameAr: 'عيادات طبية', nameEn: 'Medical clinics', icon: 'stethoscope', sortOrder: 24 },
  { slug: 'general-retail', nameAr: 'متاجر عامة', nameEn: 'General retail', icon: 'store', sortOrder: 25 }
];

async function seedStoreTypes(prisma) {
  for (const item of storeTypes) {
    await prisma.storeType.upsert({
      where: { slug: item.slug },
      update: {
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        icon: item.icon ?? null,
        sortOrder: item.sortOrder,
        isActive: true,
        deletedAt: null
      },
      create: {
        slug: item.slug,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        icon: item.icon ?? null,
        sortOrder: item.sortOrder,
        isActive: true
      }
    });
  }

  console.log(`Seeded ${storeTypes.length} store types`);
}

module.exports = { seedStoreTypes, storeTypes };
