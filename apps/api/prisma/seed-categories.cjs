/** @typedef {{ slug: string; labelAr: string; labelEn: string }} FilterOptionDef */
/** @typedef {{ slug: string; titleAr: string; titleEn: string; sortOrder?: number; options: FilterOptionDef[] }} FilterDef */
/** @typedef {{ slug: string; parentSlug?: string | null; nameAr: string; nameEn: string; icon: string; type: string; sortOrder: number; filters?: FilterDef[] }} CategoryDef */

const { getVehicleBrandCategories } = require('./seed-vehicle-brands.cjs');

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function seedCategories(prisma) {
  const categoryBySlug = new Map();

  /** @param {CategoryDef} def */
  async function upsertCategory(def) {
    let parentId = null;
    if (def.parentSlug) {
      const cached = categoryBySlug.get(def.parentSlug);
      if (cached) parentId = cached.id;
      else {
        const parent = await prisma.category.findUnique({ where: { slug: def.parentSlug } });
        if (parent) parentId = parent.id;
      }
    }

    const category = await prisma.category.upsert({
      where: { slug: def.slug },
      update: {
        name: def.nameAr,
        nameAr: def.nameAr,
        nameEn: def.nameEn,
        icon: def.icon,
        type: def.type,
        sortOrder: def.sortOrder,
        parentId,
        isActive: true,
        deletedAt: null
      },
      create: {
        slug: def.slug,
        name: def.nameAr,
        nameAr: def.nameAr,
        nameEn: def.nameEn,
        icon: def.icon,
        type: def.type,
        sortOrder: def.sortOrder,
        parentId,
        isActive: true
      }
    });

    categoryBySlug.set(def.slug, category);

    if (def.filters?.length) {
      for (const filter of def.filters) {
        await upsertFilter(category.id, filter);
      }
    }

    return category;
  }

  /** @param {string} categoryId @param {FilterDef} filter */
  async function upsertFilter(categoryId, filter) {
    const existing = await prisma.categoryFilter.findUnique({
      where: { categoryId_slug: { categoryId, slug: filter.slug } }
    });

    if (existing) {
      await prisma.categoryFilter.update({
        where: { id: existing.id },
        data: {
          titleAr: filter.titleAr,
          titleEn: filter.titleEn,
          sortOrder: filter.sortOrder ?? existing.sortOrder,
          isActive: true,
          deletedAt: null
        }
      });

      const existingOptions = await prisma.categoryFilterOption.findMany({
        where: { filterId: existing.id, deletedAt: null }
      });

      for (const [index, option] of filter.options.entries()) {
        const matched = existingOptions.find((item) => item.slug === option.slug);
        if (matched) {
          await prisma.categoryFilterOption.update({
            where: { id: matched.id },
            data: {
              labelAr: option.labelAr,
              labelEn: option.labelEn,
              sortOrder: (index + 1) * 10,
              isActive: true,
              deletedAt: null
            }
          });
        } else {
          await prisma.categoryFilterOption.create({
            data: {
              filterId: existing.id,
              labelAr: option.labelAr,
              labelEn: option.labelEn,
              slug: option.slug,
              sortOrder: (index + 1) * 10,
              isActive: true
            }
          });
        }
      }

      return existing;
    }

    return prisma.categoryFilter.create({
      data: {
        categoryId,
        titleAr: filter.titleAr,
        titleEn: filter.titleEn,
        slug: filter.slug,
        sortOrder: filter.sortOrder ?? 10,
        isActive: true,
        options: {
          create: filter.options.map((option, index) => ({
            labelAr: option.labelAr,
            labelEn: option.labelEn,
            slug: option.slug,
            sortOrder: (index + 1) * 10,
            isActive: true
          }))
        }
      }
    });
  }

  /** @param {CategoryDef[]} defs */
  function sortByDepth(defs) {
    const bySlug = new Map(defs.map((def) => [def.slug, def]));
    const depthCache = new Map();

    /** @param {CategoryDef} def */
    const depthOf = (def) => {
      if (depthCache.has(def.slug)) return depthCache.get(def.slug);
      if (!def.parentSlug) {
        depthCache.set(def.slug, 0);
        return 0;
      }
      const parent = bySlug.get(def.parentSlug);
      const depth = parent ? depthOf(parent) + 1 : 0;
      depthCache.set(def.slug, depth);
      return depth;
    };

    return [...defs].sort((a, b) => depthOf(a) - depthOf(b) || a.sortOrder - b.sortOrder);
  }

  const categories = sortByDepth(getCategoryDefinitions());

  for (const def of categories) {
    await upsertCategory(def);
  }
}

/** @returns {CategoryDef[]} */
function getCategoryDefinitions() {
  const cond = (slug, ar, en) => ({ slug, labelAr: ar, labelEn: en });

  return [
    // ─── Root: Cars & Vehicles ───
    {
      slug: 'cars',
      nameAr: 'سيارات ومركبات',
      nameEn: 'Cars & Vehicles',
      icon: 'car',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'passenger-cars',
      parentSlug: 'cars',
      nameAr: 'سيارات',
      nameEn: 'Passenger Cars',
      icon: 'car',
      type: 'PRODUCT',
      sortOrder: 10,
      filters: [
        {
          slug: 'condition',
          titleAr: 'الحالة',
          titleEn: 'Condition',
          sortOrder: 10,
          options: [cond('new', 'جديد', 'New'), cond('used', 'مستعمل', 'Used')]
        },
        {
          slug: 'body-type',
          titleAr: 'نوع الهيكل',
          titleEn: 'Body Type',
          sortOrder: 20,
          options: [
            cond('sedan', 'سيدان', 'Sedan'),
            cond('hatchback', 'هاتشباك', 'Hatchback'),
            cond('coupe', 'كوبيه', 'Coupe'),
            cond('suv', 'دفع رباعي', 'SUV'),
            cond('pickup', 'بيك أب', 'Pickup'),
            cond('van', 'فان', 'Van'),
            cond('wagon', 'ستيشن', 'Wagon'),
            cond('convertible', 'مكشوفة', 'Convertible')
          ]
        },
        {
          slug: 'fuel-type',
          titleAr: 'نوع الوقود',
          titleEn: 'Fuel Type',
          sortOrder: 30,
          options: [
            cond('petrol', 'بنزين', 'Petrol'),
            cond('diesel', 'ديزل', 'Diesel'),
            cond('hybrid', 'هايبرد', 'Hybrid'),
            cond('electric', 'كهربائي', 'Electric')
          ]
        },
        {
          slug: 'transmission',
          titleAr: 'ناقل الحركة',
          titleEn: 'Transmission',
          sortOrder: 40,
          options: [cond('automatic', 'أوتوماتيك', 'Automatic'), cond('manual', 'يدوي', 'Manual')]
        },
        {
          slug: 'mileage',
          titleAr: 'المسافة المقطوعة',
          titleEn: 'Mileage',
          sortOrder: 50,
          options: [
            cond('0-50000', '0 - 50,000 كم', '0 - 50,000 km'),
            cond('50000-100000', '50,000 - 100,000 كم', '50,000 - 100,000 km'),
            cond('100000-150000', '100,000 - 150,000 كم', '100,000 - 150,000 km'),
            cond('150000-plus', '150,000+ كم', '150,000+ km')
          ]
        }
      ]
    },
    {
      slug: 'motorcycles',
      parentSlug: 'cars',
      nameAr: 'دراجات نارية',
      nameEn: 'Motorcycles',
      icon: 'bike',
      type: 'PRODUCT',
      sortOrder: 20,
      filters: [
        {
          slug: 'condition',
          titleAr: 'الحالة',
          titleEn: 'Condition',
          options: [cond('new', 'جديد', 'New'), cond('used', 'مستعمل', 'Used')]
        },
        {
          slug: 'engine-cc',
          titleAr: 'سعة المحرك',
          titleEn: 'Engine Size',
          options: [
            cond('under-150', 'أقل من 150 سي سي', 'Under 150cc'),
            cond('150-250', '150 - 250 سي سي', '150-250cc'),
            cond('250-500', '250 - 500 سي سي', '250-500cc'),
            cond('500-plus', '500+ سي سي', '500cc+')
          ]
        }
      ]
    },
    {
      slug: 'motorcycle-parts',
      parentSlug: 'motorcycles',
      nameAr: 'قطع غيار دراجات',
      nameEn: 'Motorcycle Parts',
      icon: 'wrench',
      type: 'PRODUCT',
      sortOrder: 5000
    },
    {
      slug: 'motorcycle-accessories',
      parentSlug: 'motorcycles',
      nameAr: 'زينة وإكسسوارات دراجات',
      nameEn: 'Motorcycle Accessories',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 5010
    },
    {
      slug: 'trucks-buses',
      parentSlug: 'cars',
      nameAr: 'شاحنات وحافلات',
      nameEn: 'Trucks & Buses',
      icon: 'truck',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'boats-marine',
      parentSlug: 'cars',
      nameAr: 'قوارب ومارين',
      nameEn: 'Boats & Marine',
      icon: 'map-pin',
      type: 'PRODUCT',
      sortOrder: 40
    },
    {
      slug: 'car-rental',
      parentSlug: 'cars',
      nameAr: 'سيارات للإيجار',
      nameEn: 'Car Rental',
      icon: 'car',
      type: 'SERVICE',
      sortOrder: 50
    },
    {
      slug: 'car-spare-parts',
      parentSlug: 'cars',
      nameAr: 'قطع غيار سيارات',
      nameEn: 'Car Spare Parts',
      icon: 'wrench',
      type: 'PRODUCT',
      sortOrder: 60
    },
    {
      slug: 'engine-parts',
      parentSlug: 'car-spare-parts',
      nameAr: 'قطع محرك',
      nameEn: 'Engine Parts',
      icon: 'wrench',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'body-parts',
      parentSlug: 'car-spare-parts',
      nameAr: 'قطع هيكل',
      nameEn: 'Body Parts',
      icon: 'wrench',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'tires-wheels',
      parentSlug: 'car-spare-parts',
      nameAr: 'إطارات وجنوط',
      nameEn: 'Tires & Wheels',
      icon: 'car',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'car-accessories',
      parentSlug: 'cars',
      nameAr: 'زينة وإكسسوارات سيارات',
      nameEn: 'Car Accessories',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 70
    },
    {
      slug: 'number-plates',
      parentSlug: 'cars',
      nameAr: 'أرقام مركبات',
      nameEn: 'Vehicle Number Plates',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 80
    },

    // ─── Real Estate ───
    {
      slug: 'real-estate',
      nameAr: 'عقارات',
      nameEn: 'Real Estate',
      icon: 'building',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'real-estate-sale',
      parentSlug: 'real-estate',
      nameAr: 'عقارات للبيع',
      nameEn: 'Real Estate for Sale',
      icon: 'building',
      type: 'PRODUCT',
      sortOrder: 10,
      filters: [
        {
          slug: 'property-type',
          titleAr: 'نوع العقار',
          titleEn: 'Property Type',
          options: [
            cond('apartment', 'شقة', 'Apartment'),
            cond('villa', 'فيلا', 'Villa'),
            cond('land', 'أرض', 'Land'),
            cond('shop', 'محل تجاري', 'Shop'),
            cond('office', 'مكتب', 'Office'),
            cond('warehouse', 'مستودع', 'Warehouse')
          ]
        },
        {
          slug: 'bedrooms',
          titleAr: 'غرف النوم',
          titleEn: 'Bedrooms',
          options: [
            cond('studio', 'استوديو', 'Studio'),
            cond('1', '1', '1'),
            cond('2', '2', '2'),
            cond('3', '3', '3'),
            cond('4-plus', '4+', '4+')
          ]
        },
        {
          slug: 'furnished',
          titleAr: 'التأثيث',
          titleEn: 'Furnishing',
          options: [
            cond('furnished', 'مفروش', 'Furnished'),
            cond('semi-furnished', 'نصف مفروش', 'Semi-furnished'),
            cond('unfurnished', 'غير مفروش', 'Unfurnished')
          ]
        }
      ]
    },
    {
      slug: 'real-estate-rent',
      parentSlug: 'real-estate',
      nameAr: 'عقارات للإيجار',
      nameEn: 'Real Estate for Rent',
      icon: 'home',
      type: 'PRODUCT',
      sortOrder: 20,
      filters: [
        {
          slug: 'property-type',
          titleAr: 'نوع العقار',
          titleEn: 'Property Type',
          options: [
            cond('apartment', 'شقة', 'Apartment'),
            cond('villa', 'فيلا', 'Villa'),
            cond('shop', 'محل تجاري', 'Shop'),
            cond('office', 'مكتب', 'Office'),
            cond('room', 'غرفة', 'Room')
          ]
        },
        {
          slug: 'rent-period',
          titleAr: 'مدة الإيجار',
          titleEn: 'Rent Period',
          options: [
            cond('monthly', 'شهري', 'Monthly'),
            cond('yearly', 'سنوي', 'Yearly'),
            cond('daily', 'يومي', 'Daily')
          ]
        }
      ]
    },
    {
      slug: 'commercial-property',
      parentSlug: 'real-estate',
      nameAr: 'عقارات تجارية',
      nameEn: 'Commercial Property',
      icon: 'store',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'land-plots',
      parentSlug: 'real-estate',
      nameAr: 'أراضٍ وقطع',
      nameEn: 'Land & Plots',
      icon: 'map-pin',
      type: 'PRODUCT',
      sortOrder: 40
    },

    // ─── Electronics ───
    {
      slug: 'electronics',
      nameAr: 'إلكترونيات',
      nameEn: 'Electronics',
      icon: 'monitor',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'mobiles-tablets',
      parentSlug: 'electronics',
      nameAr: 'جوالات وأجهزة لوحية',
      nameEn: 'Mobiles & Tablets',
      icon: 'smartphone',
      type: 'PRODUCT',
      sortOrder: 10,
      filters: [
        {
          slug: 'condition',
          titleAr: 'الحالة',
          titleEn: 'Condition',
          options: [cond('new', 'جديد', 'New'), cond('used', 'مستعمل', 'Used'), cond('refurbished', 'مجدّد', 'Refurbished')]
        },
        {
          slug: 'storage',
          titleAr: 'سعة التخزين',
          titleEn: 'Storage',
          options: [
            cond('64gb', '64 GB', '64 GB'),
            cond('128gb', '128 GB', '128 GB'),
            cond('256gb', '256 GB', '256 GB'),
            cond('512gb-plus', '512 GB+', '512 GB+')
          ]
        }
      ]
    },
    {
      slug: 'computers-laptops',
      parentSlug: 'electronics',
      nameAr: 'حاسوب ومحمول',
      nameEn: 'Computers & Laptops',
      icon: 'laptop',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'tv-audio',
      parentSlug: 'electronics',
      nameAr: 'تلفزيون وصوتيات',
      nameEn: 'TV & Audio',
      icon: 'monitor',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'cameras',
      parentSlug: 'electronics',
      nameAr: 'كاميرات وتصوير',
      nameEn: 'Cameras & Photography',
      icon: 'monitor',
      type: 'PRODUCT',
      sortOrder: 40
    },
    {
      slug: 'gaming-electronics',
      parentSlug: 'electronics',
      nameAr: 'ألعاب إلكترونية',
      nameEn: 'Gaming',
      icon: 'gamepad',
      type: 'PRODUCT',
      sortOrder: 50
    },
    {
      slug: 'wearables',
      parentSlug: 'electronics',
      nameAr: 'ساعات ذكية وأجهزة قابلة للارتداء',
      nameEn: 'Wearables',
      icon: 'watch',
      type: 'PRODUCT',
      sortOrder: 60
    },
    {
      slug: 'electronics-accessories',
      parentSlug: 'electronics',
      nameAr: 'إكسسوارات إلكترونية',
      nameEn: 'Electronics Accessories',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 70
    },

    // ─── Fashion & Beauty ───
    {
      slug: 'fashion-beauty',
      nameAr: 'أزياء وموضة',
      nameEn: 'Fashion & Beauty',
      icon: 'shirt',
      type: 'PRODUCT',
      sortOrder: 40
    },
    {
      slug: 'clothing-men',
      parentSlug: 'fashion-beauty',
      nameAr: 'ملابس رجالية',
      nameEn: "Men's Clothing",
      icon: 'shirt',
      type: 'PRODUCT',
      sortOrder: 10,
      filters: [
        {
          slug: 'condition',
          titleAr: 'الحالة',
          titleEn: 'Condition',
          options: [cond('new', 'جديد', 'New'), cond('used', 'مستعمل', 'Used')]
        },
        {
          slug: 'size',
          titleAr: 'المقاس',
          titleEn: 'Size',
          options: [
            cond('xs', 'XS', 'XS'),
            cond('s', 'S', 'S'),
            cond('m', 'M', 'M'),
            cond('l', 'L', 'L'),
            cond('xl', 'XL', 'XL'),
            cond('xxl', 'XXL+', 'XXL+')
          ]
        }
      ]
    },
    {
      slug: 'clothing-women',
      parentSlug: 'fashion-beauty',
      nameAr: 'ملابس نسائية',
      nameEn: "Women's Clothing",
      icon: 'shirt',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'clothing-kids',
      parentSlug: 'fashion-beauty',
      nameAr: 'ملابس أطفال',
      nameEn: "Kids' Clothing",
      icon: 'baby',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'shoes',
      parentSlug: 'fashion-beauty',
      nameAr: 'أحذية',
      nameEn: 'Shoes',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 40
    },
    {
      slug: 'bags-wallets',
      parentSlug: 'fashion-beauty',
      nameAr: 'حقائب ومحافظ',
      nameEn: 'Bags & Wallets',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 50
    },
    {
      slug: 'watches-jewelry',
      parentSlug: 'fashion-beauty',
      nameAr: 'ساعات ومجوهرات',
      nameEn: 'Watches & Jewelry',
      icon: 'watch',
      type: 'PRODUCT',
      sortOrder: 60
    },
    {
      slug: 'beauty-cosmetics',
      parentSlug: 'fashion-beauty',
      nameAr: 'مستحضرات تجميل',
      nameEn: 'Beauty & Cosmetics',
      icon: 'palette',
      type: 'PRODUCT',
      sortOrder: 70
    },
    {
      slug: 'perfumes',
      parentSlug: 'fashion-beauty',
      nameAr: 'عطور',
      nameEn: 'Perfumes',
      icon: 'palette',
      type: 'PRODUCT',
      sortOrder: 80
    },

    // ─── Home & Garden ───
    {
      slug: 'home-garden',
      nameAr: 'منزل وحديقة',
      nameEn: 'Home & Garden',
      icon: 'sofa',
      type: 'PRODUCT',
      sortOrder: 50
    },
    {
      slug: 'furniture',
      parentSlug: 'home-garden',
      nameAr: 'أثاث',
      nameEn: 'Furniture',
      icon: 'sofa',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'home-appliances',
      parentSlug: 'home-garden',
      nameAr: 'أجهزة منزلية',
      nameEn: 'Home Appliances',
      icon: 'monitor',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'kitchen-dining',
      parentSlug: 'home-garden',
      nameAr: 'مطبخ وسفرة',
      nameEn: 'Kitchen & Dining',
      icon: 'utensils',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'garden-outdoor',
      parentSlug: 'home-garden',
      nameAr: 'حديقة وخارج المنزل',
      nameEn: 'Garden & Outdoor',
      icon: 'home',
      type: 'PRODUCT',
      sortOrder: 40
    },
    {
      slug: 'home-decor',
      parentSlug: 'home-garden',
      nameAr: 'ديكور منزلي',
      nameEn: 'Home Decor',
      icon: 'palette',
      type: 'PRODUCT',
      sortOrder: 50
    },
    {
      slug: 'tools-diy',
      parentSlug: 'home-garden',
      nameAr: 'أدوات و DIY',
      nameEn: 'Tools & DIY',
      icon: 'wrench',
      type: 'PRODUCT',
      sortOrder: 60
    },

    // ─── Sports & Outdoors ───
    {
      slug: 'sports-outdoors',
      nameAr: 'رياضة ونشاطات خارجية',
      nameEn: 'Sports & Outdoors',
      icon: 'bike',
      type: 'PRODUCT',
      sortOrder: 60
    },
    {
      slug: 'sports-equipment',
      parentSlug: 'sports-outdoors',
      nameAr: 'معدات رياضية',
      nameEn: 'Sports Equipment',
      icon: 'dumbbell',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'bicycles',
      parentSlug: 'sports-outdoors',
      nameAr: 'دراجات هوائية',
      nameEn: 'Bicycles',
      icon: 'bike',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'camping-hiking',
      parentSlug: 'sports-outdoors',
      nameAr: 'تخييم وتنزه',
      nameEn: 'Camping & Hiking',
      icon: 'map-pin',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'fitness-gym',
      parentSlug: 'sports-outdoors',
      nameAr: 'لياقة وصالات رياضية',
      nameEn: 'Fitness & Gym',
      icon: 'dumbbell',
      type: 'PRODUCT',
      sortOrder: 40
    },

    // ─── Babies & Kids ───
    {
      slug: 'babies-kids',
      nameAr: 'أطفال ورضع',
      nameEn: 'Babies & Kids',
      icon: 'baby',
      type: 'PRODUCT',
      sortOrder: 70
    },
    {
      slug: 'baby-gear',
      parentSlug: 'babies-kids',
      nameAr: 'مستلزمات أطفال',
      nameEn: 'Baby Gear',
      icon: 'baby',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'toys-games',
      parentSlug: 'babies-kids',
      nameAr: 'ألعاب',
      nameEn: 'Toys & Games',
      icon: 'gamepad',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'kids-furniture',
      parentSlug: 'babies-kids',
      nameAr: 'أثاث أطفال',
      nameEn: 'Kids Furniture',
      icon: 'sofa',
      type: 'PRODUCT',
      sortOrder: 30
    },

    // ─── Pets & Animals ───
    {
      slug: 'pets-animals',
      nameAr: 'حيوانات أليفة',
      nameEn: 'Pets & Animals',
      icon: 'paw',
      type: 'PRODUCT',
      sortOrder: 80
    },
    {
      slug: 'dogs',
      parentSlug: 'pets-animals',
      nameAr: 'كلاب',
      nameEn: 'Dogs',
      icon: 'paw',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'cats',
      parentSlug: 'pets-animals',
      nameAr: 'قطط',
      nameEn: 'Cats',
      icon: 'paw',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'birds',
      parentSlug: 'pets-animals',
      nameAr: 'طيور',
      nameEn: 'Birds',
      icon: 'paw',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'livestock',
      parentSlug: 'pets-animals',
      nameAr: 'مواشي وحيوانات مزرعة',
      nameEn: 'Livestock',
      icon: 'paw',
      type: 'PRODUCT',
      sortOrder: 40
    },
    {
      slug: 'pet-supplies',
      parentSlug: 'pets-animals',
      nameAr: 'مستلزمات حيوانات',
      nameEn: 'Pet Supplies',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 50
    },

    // ─── Books & Media ───
    {
      slug: 'books-media',
      nameAr: 'كتب ووسائط',
      nameEn: 'Books & Media',
      icon: 'book',
      type: 'PRODUCT',
      sortOrder: 90
    },
    {
      slug: 'books',
      parentSlug: 'books-media',
      nameAr: 'كتب',
      nameEn: 'Books',
      icon: 'book',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'music-movies',
      parentSlug: 'books-media',
      nameAr: 'موسيقى وأفلام',
      nameEn: 'Music & Movies',
      icon: 'book',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'musical-instruments',
      parentSlug: 'books-media',
      nameAr: 'آلات موسيقية',
      nameEn: 'Musical Instruments',
      icon: 'book',
      type: 'PRODUCT',
      sortOrder: 30
    },

    // ─── Business & Industrial ───
    {
      slug: 'business-industrial',
      nameAr: 'تجارة وصناعة',
      nameEn: 'Business & Industrial',
      icon: 'store',
      type: 'PRODUCT',
      sortOrder: 100
    },
    {
      slug: 'office-equipment',
      parentSlug: 'business-industrial',
      nameAr: 'معدات مكتبية',
      nameEn: 'Office Equipment',
      icon: 'briefcase',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'industrial-machinery',
      parentSlug: 'business-industrial',
      nameAr: 'آلات صناعية',
      nameEn: 'Industrial Machinery',
      icon: 'hammer',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'restaurant-equipment',
      parentSlug: 'business-industrial',
      nameAr: 'معدات مطاعم',
      nameEn: 'Restaurant Equipment',
      icon: 'utensils',
      type: 'PRODUCT',
      sortOrder: 30
    },

    // ─── Food & Health ───
    {
      slug: 'food-beverages',
      nameAr: 'أطعمة ومشروبات',
      nameEn: 'Food & Beverages',
      icon: 'utensils',
      type: 'PRODUCT',
      sortOrder: 110
    },
    {
      slug: 'health-wellness',
      nameAr: 'صحة وعافية',
      nameEn: 'Health & Wellness',
      icon: 'stethoscope',
      type: 'PRODUCT',
      sortOrder: 120
    },
    {
      slug: 'medical-equipment',
      parentSlug: 'health-wellness',
      nameAr: 'معدات طبية',
      nameEn: 'Medical Equipment',
      icon: 'stethoscope',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'wellness-products',
      parentSlug: 'health-wellness',
      nameAr: 'منتجات عافية',
      nameEn: 'Wellness Products',
      icon: 'heart',
      type: 'PRODUCT',
      sortOrder: 20
    },

    // ─── Antiques & Collectibles ───
    {
      slug: 'antiques-collectibles',
      nameAr: 'تحف ومقتنيات',
      nameEn: 'Antiques & Collectibles',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 130
    },
    {
      slug: 'art-handcrafts',
      parentSlug: 'antiques-collectibles',
      nameAr: 'فنون وحرف يدوية',
      nameEn: 'Art & Handcrafts',
      icon: 'palette',
      type: 'PRODUCT',
      sortOrder: 10
    },

    // ─── Services ───
    {
      slug: 'services',
      nameAr: 'الخدمات',
      nameEn: 'Services',
      icon: 'wrench',
      type: 'SERVICE',
      sortOrder: 140
    },
    {
      slug: 'home-services',
      parentSlug: 'services',
      nameAr: 'خدمات منزلية',
      nameEn: 'Home Services',
      icon: 'home',
      type: 'SERVICE',
      sortOrder: 10
    },
    {
      slug: 'cleaning-services',
      parentSlug: 'services',
      nameAr: 'تنظيف',
      nameEn: 'Cleaning',
      icon: 'wrench',
      type: 'SERVICE',
      sortOrder: 20
    },
    {
      slug: 'maintenance-repair',
      parentSlug: 'services',
      nameAr: 'صيانة وإصلاح',
      nameEn: 'Maintenance & Repair',
      icon: 'wrench',
      type: 'SERVICE',
      sortOrder: 30
    },
    {
      slug: 'legal-accounting',
      parentSlug: 'services',
      nameAr: 'قانونية ومحاسبة',
      nameEn: 'Legal & Accounting',
      icon: 'briefcase',
      type: 'SERVICE',
      sortOrder: 40
    },
    {
      slug: 'events-catering',
      parentSlug: 'services',
      nameAr: 'مناسبات وتموين',
      nameEn: 'Events & Catering',
      icon: 'utensils',
      type: 'SERVICE',
      sortOrder: 50
    },
    {
      slug: 'beauty-services',
      parentSlug: 'services',
      nameAr: 'خدمات تجميل',
      nameEn: 'Beauty Services',
      icon: 'palette',
      type: 'SERVICE',
      sortOrder: 60
    },
    {
      slug: 'education-tutoring',
      parentSlug: 'services',
      nameAr: 'تعليم ودروس خصوصية',
      nameEn: 'Education & Tutoring',
      icon: 'graduation',
      type: 'SERVICE',
      sortOrder: 70
    },

    // ─── Jobs ───
    {
      slug: 'jobs',
      nameAr: 'وظائف شاغرة',
      nameEn: 'Jobs',
      icon: 'briefcase',
      type: 'JOB',
      sortOrder: 150,
      filters: [
        {
          slug: 'employment-type',
          titleAr: 'نوع التوظيف',
          titleEn: 'Employment Type',
          options: [
            cond('full-time', 'دوام كامل', 'Full-time'),
            cond('part-time', 'دوام جزئي', 'Part-time'),
            cond('contract', 'عقد', 'Contract'),
            cond('remote', 'عن بُعد', 'Remote')
          ]
        },
        {
          slug: 'experience-level',
          titleAr: 'مستوى الخبرة',
          titleEn: 'Experience Level',
          options: [
            cond('entry', 'مبتدئ', 'Entry level'),
            cond('mid', 'متوسط', 'Mid level'),
            cond('senior', 'خبير', 'Senior')
          ]
        }
      ]
    },
    {
      slug: 'job-seekers',
      nameAr: 'باحثين عن عمل',
      nameEn: 'Job Seekers',
      icon: 'search',
      type: 'JOB_REQUEST',
      sortOrder: 160,
      filters: [
        {
          slug: 'experience-level',
          titleAr: 'مستوى الخبرة',
          titleEn: 'Experience Level',
          options: [
            cond('entry', 'مبتدئ', 'Entry level'),
            cond('mid', 'متوسط', 'Mid level'),
            cond('senior', 'خبير', 'Senior')
          ]
        }
      ]
    },

    // ─── Wanted to Buy ───
    {
      slug: 'wanted',
      nameAr: 'مطلوب للشراء',
      nameEn: 'Wanted to Buy',
      icon: '🛒',
      type: 'PRODUCT',
      sortOrder: 170
    },
    {
      slug: 'wanted-cars',
      parentSlug: 'wanted',
      nameAr: 'مطلوب سيارات',
      nameEn: 'Wanted Cars',
      icon: 'car',
      type: 'PRODUCT',
      sortOrder: 10
    },
    {
      slug: 'wanted-electronics',
      parentSlug: 'wanted',
      nameAr: 'مطلوب إلكترونيات',
      nameEn: 'Wanted Electronics',
      icon: 'smartphone',
      type: 'PRODUCT',
      sortOrder: 20
    },
    {
      slug: 'wanted-property',
      parentSlug: 'wanted',
      nameAr: 'مطلوب عقارات',
      nameEn: 'Wanted Property',
      icon: 'building',
      type: 'PRODUCT',
      sortOrder: 30
    },
    {
      slug: 'wanted-other',
      parentSlug: 'wanted',
      nameAr: 'مطلوب أخرى',
      nameEn: 'Other Wanted',
      icon: 'tag',
      type: 'PRODUCT',
      sortOrder: 40
    },

    // ─── Training Courses ───
    {
      slug: 'training-courses',
      nameAr: 'دورات تدريبية',
      nameEn: 'Training Courses',
      icon: 'graduation',
      type: 'SERVICE',
      sortOrder: 180,
      filters: [
        {
          slug: 'delivery-mode',
          titleAr: 'طريقة التدريب',
          titleEn: 'Delivery Mode',
          options: [
            cond('online', 'أونلاين', 'Online'),
            cond('in-person', 'حضوري', 'In-person'),
            cond('hybrid', 'مختلط', 'Hybrid')
          ]
        },
        {
          slug: 'duration',
          titleAr: 'المدة',
          titleEn: 'Duration',
          options: [
            cond('short', 'قصيرة (أيام)', 'Short (days)'),
            cond('medium', 'متوسطة (أسابيع)', 'Medium (weeks)'),
            cond('long', 'طويلة (أشهر)', 'Long (months)')
          ]
        }
      ]
    },
    {
      slug: 'professional-courses',
      parentSlug: 'training-courses',
      nameAr: 'دورات مهنية',
      nameEn: 'Professional Courses',
      icon: 'briefcase',
      type: 'SERVICE',
      sortOrder: 10
    },
    {
      slug: 'language-courses',
      parentSlug: 'training-courses',
      nameAr: 'دورات لغات',
      nameEn: 'Language Courses',
      icon: 'book',
      type: 'SERVICE',
      sortOrder: 20
    },
    {
      slug: 'tech-courses',
      parentSlug: 'training-courses',
      nameAr: 'دورات تقنية',
      nameEn: 'Tech Courses',
      icon: 'laptop',
      type: 'SERVICE',
      sortOrder: 30
    },

    // ─── Tourism & Trips ───
    {
      slug: 'tourism-trips',
      nameAr: 'رحلات سياحية',
      nameEn: 'Tourism & Trips',
      icon: 'plane',
      type: 'SERVICE',
      sortOrder: 190,
      filters: [
        {
          slug: 'trip-type',
          titleAr: 'نوع الرحلة',
          titleEn: 'Trip Type',
          options: [
            cond('domestic', 'داخل عُمان', 'Domestic'),
            cond('international', 'دولية', 'International'),
            cond('adventure', 'مغامرة', 'Adventure'),
            cond('family', 'عائلية', 'Family')
          ]
        },
        {
          slug: 'duration',
          titleAr: 'المدة',
          titleEn: 'Duration',
          options: [
            cond('day-trip', 'يوم واحد', 'Day trip'),
            cond('weekend', 'نهاية أسبوع', 'Weekend'),
            cond('week-plus', 'أسبوع أو أكثر', 'Week+')
          ]
        }
      ]
    },
    {
      slug: 'domestic-trips',
      parentSlug: 'tourism-trips',
      nameAr: 'رحلات داخلية',
      nameEn: 'Domestic Trips',
      icon: 'map-pin',
      type: 'SERVICE',
      sortOrder: 10
    },
    {
      slug: 'international-trips',
      parentSlug: 'tourism-trips',
      nameAr: 'رحلات دولية',
      nameEn: 'International Trips',
      icon: 'plane',
      type: 'SERVICE',
      sortOrder: 20
    },
    {
      slug: 'hotels-stays',
      parentSlug: 'tourism-trips',
      nameAr: 'فنادق وإقامة',
      nameEn: 'Hotels & Stays',
      icon: 'home',
      type: 'SERVICE',
      sortOrder: 30
    },

    // ─── Logistics ───
    {
      slug: 'logistics',
      nameAr: 'نقل وتوصيل',
      nameEn: 'Logistics & Delivery',
      icon: 'truck',
      type: 'LOGISTICS',
      sortOrder: 200,
      filters: [
        {
          slug: 'service-type',
          titleAr: 'نوع الخدمة',
          titleEn: 'Service Type',
          options: [
            cond('local-delivery', 'توصيل محلي', 'Local delivery'),
            cond('intercity', 'بين المدن', 'Intercity'),
            cond('moving', 'نقل أثاث', 'Moving'),
            cond('freight', 'شحن بضائع', 'Freight')
          ]
        }
      ]
    },

    // ─── Construction ───
    {
      slug: 'construction',
      nameAr: 'بناء ومقاولات',
      nameEn: 'Construction',
      icon: 'hammer',
      type: 'CONSTRUCTION',
      sortOrder: 210
    },
    {
      slug: 'building-materials',
      parentSlug: 'construction',
      nameAr: 'مواد بناء',
      nameEn: 'Building Materials',
      icon: 'hammer',
      type: 'CONSTRUCTION',
      sortOrder: 10
    },
    {
      slug: 'construction-services',
      parentSlug: 'construction',
      nameAr: 'خدمات مقاولات',
      nameEn: 'Construction Services',
      icon: 'wrench',
      type: 'CONSTRUCTION',
      sortOrder: 20
    },
    {
      slug: 'construction-tools',
      parentSlug: 'construction',
      nameAr: 'معدات وأدوات بناء',
      nameEn: 'Construction Tools',
      icon: 'hammer',
      type: 'CONSTRUCTION',
      sortOrder: 30
    },
    ...getVehicleBrandCategories()
  ];
}

module.exports = { seedCategories, getCategoryDefinitions };
