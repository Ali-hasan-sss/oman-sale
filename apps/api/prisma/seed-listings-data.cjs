/** @typedef {{ titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string; price?: number; condition?: 'NEW' | 'USED'; images: string[] }} DemoListingContent */

function img(id) {
  return `https://images.unsplash.com/photo-${id}?w=900&h=700&fit=crop`;
}

/** @param {string} titleAr @param {string} titleEn @param {string} descAr @param {string} descEn @param {number | undefined} price @param {string[]} images @param {'NEW' | 'USED' | undefined} [condition] @returns {DemoListingContent} */
function L(titleAr, titleEn, descAr, descEn, price, images, condition) {
  return { titleAr, titleEn, descriptionAr: descAr, descriptionEn: descEn, price, images, condition };
}

const desc = (ar, en) => ({ ar, en });

/** @type {Record<string, DemoListingContent>} */
const DEMO_LISTING_CONTENT = {
  cars: L(
    'معرض سيارات متنوعة - عروض تجريبية',
    'Mixed car listings - demo showcase',
    'مجموعة تجريبية من إعلانات السيارات والمركبات في عمان سيل. استكشف الفئات الفرعية للاطلاع على أمثلة واقعية.',
    'Demo collection of vehicle listings on Oman Sale. Browse subcategories for realistic sample ads.',
    8500,
    [img('1492144534655-ae79c964c9d7'), img('1549317661-bd32c8ce0db2')],
    'USED'
  ),
  'passenger-cars': L(
    'Toyota Land Cruiser 2022 - حالة ممتازة',
    'Toyota Land Cruiser 2022 - Excellent condition',
    'سيارة دفع رباعي فاخرة، مواصفات خليجية، صيانة دورية في الوكالة، ممشى 45,000 كم فقط.',
    'Premium SUV, GCC specs, agency-maintained, only 45,000 km mileage.',
    18500,
    [img('1533473359331-0135ef1b58bf'), img('1494976388531-d1058498cdd8')],
    'USED'
  ),
  motorcycles: L(
    'Honda CB500X 2023 - دراجة نارية',
    'Honda CB500X 2023 - Adventure motorcycle',
    'دراجة نارية بحالة ممتازة، استخدام خفيف، مع خوذة وحقيبة جانبية.',
    'Adventure bike in excellent condition, lightly used, includes helmet and side bags.',
    3200,
    [img('1558981403-c5f9899a5761'), img('1449426464389-8a0d8d2a2e5b')],
    'USED'
  ),
  'motorcycle-parts': L(
    'قطع غيار دراجات نارية أصلية',
    'Genuine motorcycle spare parts',
    'مجموعة قطع غيار أصلية لدراجات Honda وYamaha، فلاتر، زيوت، وإطارات.',
    'OEM parts bundle for Honda and Yamaha bikes: filters, oils, and tires.',
    85,
    [img('1558618666-fcd25c85cd64')],
    'NEW'
  ),
  'motorcycle-accessories': L(
    'إكسسوارات دراجات - خوذ وقفازات',
    'Motorcycle accessories - helmets & gloves',
    'خوذة AGV كاملة الوجه، قفازات جلد، وحقيبة ظهر للرحلات.',
    'Full-face AGV helmet, leather gloves, and touring backpack.',
    120,
    [img('1558618666-fcd25c85cd64'), img('1449426464389-8a0d8d2a2e5b')],
    'NEW'
  ),
  'trucks-buses': L(
    'Isuzu NQR شاحنة نقل 2020',
    'Isuzu NQR cargo truck 2020',
    'شاحنة نقل بحالة جيدة، صندوق مغلق 4 طن، مناسبة للتوصيل والنقل التجاري.',
    'Well-maintained 4-ton box truck, ideal for delivery and commercial transport.',
    12500,
    [img('1601584111076-792c57abce99'), img('1586528116311-ad8dd3c8310d')],
    'USED'
  ),
  'boats-marine': L(
    'قارب صيد 28 قدم - محرك Yamaha',
    '28ft fishing boat - Yamaha engine',
    'قارب صيد مجهز بالكامل، محرك 200 حصان، GPS وصندوق تبريد.',
    'Fully equipped fishing boat, 200 HP engine, GPS and cooler box included.',
    9800,
    [img('1567894340315-4d27d1b0e0e8'), img('1544551763-46a013bb70d5')],
    'USED'
  ),
  'car-rental': L(
    'تأجير سيارات يومي - مسقط',
    'Daily car rental - Muscat',
    'أسطول متنوع من السيارات للإيجار اليومي والأسبوعي، تأمين شامل وتوصيل للمطار.',
    'Diverse fleet for daily and weekly rental, full insurance and airport delivery.',
    15,
    [img('1449965406639-454aa7438e02'), img('1502877338535-766e1452684a')],
    'NEW'
  ),
  'car-spare-parts': L(
    'قطع غيار سيارات متنوعة',
    'Mixed automotive spare parts',
    'مخزون قطع غيار أصلية وبديلة لسيارات يابانية وكorean، أسعار تنافسية.',
    'Stock of OEM and aftermarket parts for Japanese and Korean cars at competitive prices.',
    45,
    [img('1486262715619-67b85e0b08d3'), img('1625047509168-220374f6b589')],
    'NEW'
  ),
  'engine-parts': L(
    'محرك Toyota 2.4L - مجدّد',
    'Toyota 2.4L engine - refurbished',
    'محرك مجدّد بالكامل مع ضمان 6 أشهر، مناسب لطرازات Toyota Hilux وFortuner.',
    'Fully refurbished engine with 6-month warranty, fits Toyota Hilux and Fortuner models.',
    1800,
    [img('1486262715619-67b85e0b08d3')],
    'USED'
  ),
  'body-parts': L(
    'أبواب وصدامات سيارات',
    'Car doors and bumpers',
    'أبواب أمامية وخلفية وصدامات لسيارات متعددة، بحالة جيدة جداً.',
    'Front and rear doors and bumpers for various car models in very good condition.',
    250,
    [img('1625047509168-220374f6b589'), img('1486262715619-67b85e0b08d3')],
    'USED'
  ),
  'tires-wheels': L(
    'إطارات Michelin 265/65 R17 - طقم كامل',
    'Michelin 265/65 R17 tires - full set',
    'طقم أربع إطارات Michelin بحالة ممتازة، عمق مداس 7mm، مناسبة للدفع الرباعي.',
    'Set of four Michelin tires in excellent condition, 7mm tread depth, SUV fitment.',
    180,
    [img('1590362899441-1057326571301'), img('1558618666-fcd25c85cd64')],
    'USED'
  ),
  'car-accessories': L(
    'إكسسوارات سيارات - كاميرا وGPS',
    'Car accessories - camera & GPS',
    'كاميرا خلفية HD، نظام GPS، وشاحن لاسلكي للسيارة.',
    'HD rear camera, GPS navigation system, and wireless car charger.',
    65,
    [img('1492144534655-ae79c964c9d7'), img('1549317661-bd32c8ce0db2')],
    'NEW'
  ),
  'number-plates': L(
    'رقم مركبة مميز - 12345',
    'Premium vehicle plate - 12345',
    'رقم مركبة مميز للبيع، نقل فوري، جميع الإجراءات الرسمية متوفرة.',
    'Premium plate number for sale, instant transfer, all official procedures available.',
    3500,
    [img('1554224155-6726b3ff858f')],
    'USED'
  ),

  'real-estate': L(
    'عروض عقارية متنوعة في عمان',
    'Mixed real estate listings in Oman',
    'مجموعة تجريبية من إعلانات العقارات للبيع والإيجار في مختلف محافظات السلطنة.',
    'Demo real estate listings for sale and rent across Oman governorates.',
    85000,
    [img('1560518883-ce09059eeffa'), img('1522708323590-d24dbb6b0267')],
    'USED'
  ),
  'real-estate-sale': L(
    'فيلا 4 غرف في السيب - للبيع',
    '4-bedroom villa in Al Seeb - for sale',
    'فيلا حديثة 4 غرف نوم، 3 حمامات، حديقة وموقف سيارتين، قريبة من الخدمات.',
    'Modern 4-bed villa, 3 baths, garden and double parking, close to amenities.',
    95000,
    [img('1613490498596-1747f9410a8e'), img('1600596542815-ffad96c548a0')],
    'USED'
  ),
  'real-estate-rent': L(
    'شقة 2 غرف للإيجار - الخوير',
    '2-bedroom apartment for rent - Al Khoudh',
    'شقة مفروشة بالكامل، 2 غرف نوم، صالة واسعة، موقف مجاني، إيجار شهري.',
    'Fully furnished 2-bed apartment, spacious living room, free parking, monthly rent.',
    420,
    [img('1522708323590-d24dbb6b0267'), img('1502672265066-ee4c7a2b0b0a')],
    'USED'
  ),
  'commercial-property': L(
    'محل تجاري في القرم - 120 م²',
    'Commercial shop in Qurum - 120 sqm',
    'محل تجاري في موقع مميز، واجهة زجاجية، مناسب للتجزئة أو المكاتب.',
    'Prime location commercial unit, glass frontage, suitable for retail or office use.',
    45000,
    [img('1497366216548-37526070297c'), img('1497366754035-ca446c0f8f3f')],
    'USED'
  ),
  'land-plots': L(
    'أرض سكنية 600 م² - نزوى',
    'Residential land 600 sqm - Nizwa',
    'قطعة أرض سكنية في مخطط معتمد، خدمات متوفرة، موقع هادئ.',
    'Residential plot in approved scheme, utilities available, quiet location.',
    28000,
    [img('1500382017468-90403fed7c40'), img('1560518883-ce09059eeffa')],
    'NEW'
  ),

  electronics: L(
    'إلكترونيات متنوعة - عروض تجريبية',
    'Electronics demo listings',
    'استكشف أحدث الأجهزة الإلكترونية والجوالات والحاسوب في فئاتنا الفرعية.',
    'Explore the latest electronics, mobiles, and computers in our subcategories.',
    350,
    [img('1498049794561-7780e7231661'), img('1511707171634-5f897ff053aa')],
    'NEW'
  ),
  'mobiles-tablets': L(
    'iPhone 15 Pro Max 256GB',
    'iPhone 15 Pro Max 256GB',
    'جوال بحالة ممتازة، بطارية 98%، مع العلبة والشاحن الأصلي، بدون خدوش.',
    'Excellent condition, 98% battery health, with original box and charger, scratch-free.',
    420,
    [img('1511707171634-5f897ff053aa'), img('1592755323348-74d7b7c6a9f3')],
    'USED'
  ),
  'computers-laptops': L(
    'MacBook Pro M3 14" - 512GB',
    'MacBook Pro M3 14" - 512GB',
    'لابتوب Apple M3، 16GB RAM، شاشة Retina، ضمان Apple ساري.',
    'Apple M3 laptop, 16GB RAM, Retina display, active Apple warranty.',
    680,
    [img('1496181133206-798ce4d42e4c'), img('1525547719578-a969ce73a0d5')],
    'USED'
  ),
  'tv-audio': L(
    'Samsung 65" QLED 4K Smart TV',
    'Samsung 65" QLED 4K Smart TV',
    'تلفزيون ذكي 65 بوصة، دقة 4K، HDR، ريموت أصلي وقاعدة حائط.',
    '65" smart TV, 4K HDR, original remote and wall mount included.',
    380,
    [img('1593359671379-a695bd5d0f6a'), img('1461151304267-38535e780c79')],
    'USED'
  ),
  cameras: L(
    'Canon EOS R6 Mark II + عدسة 24-70',
    'Canon EOS R6 Mark II + 24-70 lens',
    'كاميرا احترافية mirrorless مع عدسة zoom، عدد شutter منخفض، مع حقيبة.',
    'Professional mirrorless camera with zoom lens, low shutter count, bag included.',
    1450,
    [img('1516035069371-29a1b244cc32'), img('1502920917128-1aa500764cbd')],
    'USED'
  ),
  'gaming-electronics': L(
    'PlayStation 5 + 3 ألعاب',
    'PlayStation 5 + 3 games',
    'جهاز PS5 مع يد تحكم إضافية و3 ألعاب: FIFA 24، Spider-Man 2، وGran Turismo.',
    'PS5 console with extra controller and 3 games: FIFA 24, Spider-Man 2, Gran Turismo.',
    195,
    [img('1606144042608-e527606212a6'), img('1542751110-89c4b7262e6c')],
    'USED'
  ),
  wearables: L(
    'Apple Watch Ultra 2 - GPS',
    'Apple Watch Ultra 2 - GPS',
    'ساعة ذكية Apple Watch Ultra 2، شريط رياضي إضافي، حالة ممتازة.',
    'Apple Watch Ultra 2, extra sport band included, excellent condition.',
    285,
    [img('1434494878577-86c23ad06645'), img('1523275335684-37898b6baf30')],
    'USED'
  ),
  'electronics-accessories': L(
    'سماعات AirPods Pro 2 - أصلية',
    'AirPods Pro 2 - genuine',
    'سماعات Apple AirPods Pro الجيل الثاني، noise cancellation، علبة شحن MagSafe.',
    'Apple AirPods Pro 2nd gen, active noise cancellation, MagSafe charging case.',
    95,
    [img('1606220588910-b3aae4a2c8a1'), img('1572569511254-d8f925a5879b')],
    'NEW'
  ),

  'fashion-beauty': L(
    'أزياء وموضة - عروض تجريبية',
    'Fashion & beauty demo listings',
    'تصفح ملابس وإكسسوارات ومنتجات تجميل من بائعين موثوقين.',
    'Browse clothing, accessories, and beauty products from trusted sellers.',
    45,
    [img('1445205170230-053b83016050'), img('1483986767635-1442f8e72996')],
    'NEW'
  ),
  'clothing-men': L(
    'بدلة رجالية كاملة - مقاس 52',
    "Men's full suit - size 52",
    'بدلة رسمية رمادية، قماش صوف فاخر، مستعملة مرة واحدة فقط.',
    'Formal grey suit, premium wool fabric, worn only once.',
    85,
    [img('1594938298603-c8148c4dae35'), img('1617137984095-7e4e6a9605f6')],
    'USED'
  ),
  'clothing-women': L(
    'فستان سهرة - تصميم عماني',
    'Evening dress - Omani design',
    'فستان سهرة أنيق بتطريز عماني تقليدي، مقاس M، بحالة جديدة.',
    'Elegant evening dress with traditional Omani embroidery, size M, like new.',
    120,
    [img('1515372039744-b8f02a3ae446'), img('1496747611214-388787789588')],
    'NEW'
  ),
  'clothing-kids': L(
    'ملابس أطفال - طقم 5 قطع',
    "Kids clothing bundle - 5 pieces",
    'طقم ملابس أطفال (3-5 سنوات) ماركات معروفة، نظيفة وبحالة ممتازة.',
    'Kids clothing bundle (ages 3-5) from known brands, clean and excellent condition.',
    25,
    [img('1503454536592-061af5fcfb05'), img('1515488042361-ee00e27e2278')],
    'USED'
  ),
  shoes: L(
    'Nike Air Max 270 - مقاس 43',
    'Nike Air Max 270 - size 43',
    'حذاء رياضي Nike بحالة جيدة جداً، لون أسود، مريح للاستخدام اليومي.',
    'Nike sneakers in very good condition, black color, comfortable for daily wear.',
    55,
    [img('1542291026-7eec264c27ff'), img('1460353586241-8441cdb8cfe0')],
    'USED'
  ),
  'bags-wallets': L(
    'حقيبة يد Louis Vuitton - أصلية',
    'Louis Vuitton handbag - authentic',
    'حقيبة يد أصلية مع شهادة، بحالة ممتازة، لون بني كلاسيكي.',
    'Authentic handbag with certificate, excellent condition, classic brown.',
    450,
    [img('1548039128-0bc3f6598841'), img('1584917865442-89bbaafcb177')],
    'USED'
  ),
  'watches-jewelry': L(
    'ساعة Rolex Submariner - أصلية',
    'Rolex Submariner - authentic',
    'ساعة Rolex Submariner أصلية مع علبة وشهادة، صيانة حديثة.',
    'Authentic Rolex Submariner with box and papers, recently serviced.',
    3200,
    [img('1524592094714-0e0654e20336'), img('1523170364687-5ae134b7ff6f')],
    'USED'
  ),
  'beauty-cosmetics': L(
    'مجموعة مكياج MAC - 12 قطعة',
    'MAC makeup set - 12 pieces',
    'مجموعة مكياج MAC كاملة، ألوان متنوعة، بعضها جديد بالكامل.',
    'Complete MAC makeup set, assorted colors, some items brand new.',
    75,
    [img('1596462502278-27bfdd403f0e'), img('1522335789203-aabd1fc54bc9')],
    'NEW'
  ),
  perfumes: L(
    'عطر Tom Ford Oud Wood 100ml',
    'Tom Ford Oud Wood 100ml',
    'عطر Tom Ford Oud Wood، 100ml، مستخدم 30% فقط، مع العلبة الأصلية.',
    'Tom Ford Oud Wood, 100ml, 70% remaining, with original box.',
    95,
    [img('1541643600914-78b084683601'), img('1595425974572-0b2d3b2a2e5b')],
    'USED'
  ),

  'home-garden': L(
    'منزل وحديقة - عروض تجريبية',
    'Home & garden demo listings',
    'أثاث، أجهزة منزلية، ومستلزمات الحديقة من بائعين في عمان.',
    'Furniture, appliances, and garden supplies from sellers across Oman.',
    150,
    [img('1555041469-a586c61ea9bc'), img('1586023492125-27b2c045efd7')],
    'USED'
  ),
  furniture: L(
    'طقم صالة L-shaped - 7 مقاعد',
    'L-shaped living room set - 7 seats',
    'طقم صالة فاخر، قماش مقاوم للبقع، لون بيج، حالة ممتازة.',
    'Premium L-shaped sofa set, stain-resistant fabric, beige, excellent condition.',
    850,
    [img('1555041469-a586c61ea9bc'), img('1493663284031-b7e00aef36d4')],
    'USED'
  ),
  'home-appliances': L(
    'ثلاجة Samsung Side-by-Side',
    'Samsung side-by-side refrigerator',
    'ثلاجة Samsung 600 لتر، موفر للطاقة، dispenser ماء وثلج، ضمان ساري.',
    'Samsung 600L fridge, energy efficient, water and ice dispenser, warranty active.',
    420,
    [img('1571175444740-2244e0d9a0c2'), img('1585659722353-9f0360c893fb')],
    'USED'
  ),
  'kitchen-dining': L(
    'طقم أواني طبخ 12 قطعة - Tefal',
    'Tefal cookware set - 12 pieces',
    'طقم أواني Tefal غير لاصقة، 12 قطعة، مستخدمة بحالة جيدة جداً.',
    'Tefal non-stick cookware set, 12 pieces, very good used condition.',
    65,
    [img('1556909114-f6e7ad7d3136'), img('1556911220-bff31c812dba')],
    'USED'
  ),
  'garden-outdoor': L(
    'أثاث حديقة - طاولة و4 كراسي',
    'Garden furniture - table and 4 chairs',
    'طقم أثاث خارجي من Rattan، مقاوم للطقس، مناسب للفناء والتراس.',
    'Weather-resistant Rattan outdoor set, perfect for patio and terrace.',
    180,
    [img('1416879595882-3373a0480b2b'), img('1600585154340-be6161a56a0c')],
    'USED'
  ),
  'home-decor': L(
    'لوحات فنية وديكور منزلي',
    'Art prints and home decor',
    'مجموعة 5 لوحات فنية بإطارات خشبية، ألوان محايدة تناسب أي ديكور.',
    'Set of 5 framed art prints, neutral colors to match any interior.',
    45,
    [img('1618225198495-1b0e5d7e5e5b'), img('1586023492125-27b2c045efd7')],
    'NEW'
  ),
  'tools-diy': L(
    'عدة Bosch كهربائية - 5 أدوات',
    'Bosch power tool kit - 5 tools',
    'مجموعة أدوات Bosch: دريل، منشار، صنفرة، مع حقيبة حمل.',
    'Bosch tool kit: drill, saw, sander, with carrying case.',
    220,
    [img('1504148455325-c37689a3f6b0'), img('1581094798796-0c285070e0ec')],
    'USED'
  ),

  'sports-outdoors': L(
    'رياضة ونشاطات خارجية - عروض تجريبية',
    'Sports & outdoors demo listings',
    'معدات رياضية، دراجات، وتخييم من بائعين في السلطنة.',
    'Sports equipment, bikes, and camping gear from sellers across Oman.',
    95,
    [img('1461896836934-ffe607ba8211'), img('1571019614242-9855c1a9d9b0')],
    'USED'
  ),
  'sports-equipment': L(
    'طقم تنس - مضربان وحقيبة',
    'Tennis set - 2 rackets and bag',
    'مضربا تنس Wilson مع حقيبة و6 كرات جديدة.',
    'Two Wilson tennis rackets with bag and 6 new balls.',
    75,
    [img('1622168562719-59c0b5e188c0'), img('1554068544-2569977c6c65')],
    'USED'
  ),
  bicycles: L(
    'دراجة جبلية Trek - 21 سرعة',
    'Trek mountain bike - 21 speed',
    'دراجة جبلية Trek، إطار ألومنيوم، فرامل disc، حالة ممتازة.',
    'Trek mountain bike, aluminum frame, disc brakes, excellent condition.',
    280,
    [img('1485965120648-891e7d2292b3'), img('1576435728670-407d066034da')],
    'USED'
  ),
  'camping-hiking': L(
    'خيمة 4 أشخاص + معدات تخييم',
    '4-person tent + camping gear',
    'خيمة Coleman 4 أشخاص، أكياس نوم، موقد، ومصباح LED.',
    'Coleman 4-person tent, sleeping bags, stove, and LED lantern.',
    120,
    [img('1478132641456-2748ee2b94b3'), img('1504280390367-361c6d9d38df')],
    'USED'
  ),
  'fitness-gym': L(
    'جهاز مشي كهربائي - ProForm',
    'ProForm electric treadmill',
    'جهاز مشي ProForm، شاشة LCD، برامج تدريب متعددة، حالة جيدة.',
    'ProForm treadmill, LCD screen, multiple workout programs, good condition.',
    350,
    [img('1571019614242-9855c1a9d9b0'), img('1534438327276-14e5300c3a48')],
    'USED'
  ),

  'babies-kids': L(
    'مستلزمات أطفال - عروض تجريبية',
    'Babies & kids demo listings',
    'عربات أطفال، ألعاب، وأثاث من بائعين موثوقين.',
    'Strollers, toys, and kids furniture from trusted sellers.',
    85,
    [img('1515488042361-ee00e27e2278'), img('1503454536592-061af5fcfb05')],
    'USED'
  ),
  'baby-gear': L(
    'عربة أطفال Chicco - 3 في 1',
    'Chicco 3-in-1 stroller',
    'عربة أطفال Chicco متعددة الاستخدامات، مع car seat، حالة ممتازة.',
    'Chicco multi-purpose stroller with car seat, excellent condition.',
    180,
    [img('1515488042361-ee00e27e2278'), img('1584469125998-50c49c0d2261')],
    'USED'
  ),
  'toys-games': L(
    'LEGO City - مجموعة 800 قطعة',
    'LEGO City set - 800 pieces',
    'مجموعة LEGO City كاملة، جميع القطع موجودة، مع دليل التجميع.',
    'Complete LEGO City set, all pieces included with assembly manual.',
    45,
    [img('1558068815-1c87555a798a'), img('1566576912321-d58ddd7a9888')],
    'USED'
  ),
  'kids-furniture': L(
    'سرير أطفال + مكتب دراسة',
    'Kids bed + study desk',
    'سرير أطفال خشبي مع مكتب دراسة ورفوف، لون أبيض، حالة جيدة.',
    'Wooden kids bed with study desk and shelves, white, good condition.',
    95,
    [img('1586023492125-27b2c045efd7'), img('1503454536592-061af5fcfb05')],
    'USED'
  ),

  'pets-animals': L(
    'حيوانات أليفة - عروض تجريبية',
    'Pets & animals demo listings',
    'كلاب، قطط، طيور، ومستلزمات الحيوانات الأليفة.',
    'Dogs, cats, birds, and pet supplies listings.',
    150,
    [img('1587300003388-59208cc962cb'), img('1450770118548-b7849831e1b2')],
    'NEW'
  ),
  dogs: L(
    'كلب Golden Retriever - 6 أشهر',
    'Golden Retriever puppy - 6 months',
    'جرو Golden Retriever مدرب على الحمام، مطعّم بالكامل، صحي ونشيط.',
    '6-month Golden Retriever puppy, house-trained, fully vaccinated, healthy and active.',
    350,
    [img('1587300003388-59208cc962cb'), img('1558788553-f29512e87c72')],
    'NEW'
  ),
  cats: L(
    'قطة Persian - أنثى',
    'Persian cat - female',
    'قطة Persian جميلة، 2 سنة، هادئة ومناسبة للعائلات، مطعّمة.',
    'Beautiful 2-year-old Persian cat, calm and family-friendly, vaccinated.',
    180,
    [img('1514880378529-68c6253a3a1b'), img('1574158622682-ec959a56011b')],
    'NEW'
  ),
  birds: L(
    'زوج ببغاء African Grey',
    'African Grey parrot pair',
    'زوج ببغاء African Grey، أليفان، مع قفص كبير ومستلزمات.',
    'Tame African Grey parrot pair with large cage and accessories.',
    800,
    [img('1552728080-bbe3e0e2b5b5'), img('1452576656250-3abeaa400858')],
    'NEW'
  ),
  livestock: L(
    '3 أغنام نعيمية للبيع',
    '3 Naimi sheep for sale',
    '3 أغنام نعيمية صحية، عمر 1-2 سنة، مناسبة للتربية أو الذبح.',
    '3 healthy Naimi sheep, 1-2 years old, suitable for breeding or slaughter.',
    450,
    [img('1484557982545-78060b8df7ea'), img('1500595046743-be5934b41a26')],
    'NEW'
  ),
  'pet-supplies': L(
    'طعام كلاب Royal Canin - 15kg',
    'Royal Canin dog food - 15kg',
    'كيس طعام كلاب Royal Canin 15kg، تاريخ صلاحية ساري، مغلق.',
    'Sealed 15kg Royal Canin dog food bag, valid expiry date.',
    35,
    [img('1583337790410-334725a4bddb'), img('1601758228041-f3b2795155a1')],
    'NEW'
  ),

  'books-media': L(
    'كتب ووسائط - عروض تجريبية',
    'Books & media demo listings',
    'كتب، أفلام، وآلات موسيقية من بائعين في عمان.',
    'Books, movies, and musical instruments from sellers in Oman.',
    25,
    [img('1481627834876-b7833e8f5570'), img('1511379938544-2101b3592d8a')],
    'USED'
  ),
  books: L(
    'مجموعة 20 كتاب - أدب عربي',
    '20-book Arabic literature bundle',
    'مجموعة كتب أدب عربي كلاسيكي ومعاصر، بحالة جيدة.',
    'Classic and contemporary Arabic literature book bundle in good condition.',
    30,
    [img('1481627834876-b7833e8f5570'), img('1512820790802-415d8348ca70')],
    'USED'
  ),
  'music-movies': L(
    'مجموعة Blu-ray - 15 فيلم',
    'Blu-ray movie collection - 15 films',
    '15 فيلم Blu-ray أصلي، أفلام عربية وأجنبية، مع العلب.',
    '15 original Blu-ray movies, Arabic and international, with cases.',
    40,
    [img('1485846234645-a62644f84728'), img('1478720568477-152d9b164e63')],
    'USED'
  ),
  'musical-instruments': L(
    'جيتار Yamaha F310 - مع حقيبة',
    'Yamaha F310 guitar with case',
    'جيتار صوتي Yamaha F310، مناسب للمبتدئين، مع حقيبة وريش.',
    'Yamaha F310 acoustic guitar, beginner-friendly, with case and picks.',
    65,
    [img('1511379938544-2101b3592d8a'), img('1516925321452-7b7541cc1b9e')],
    'USED'
  ),

  'business-industrial': L(
    'تجارة وصناعة - عروض تجريبية',
    'Business & industrial demo listings',
    'معدات مكتبية، آلات صناعية، ومستلزمات مطاعم.',
    'Office equipment, industrial machinery, and restaurant supplies.',
    500,
    [img('1497366216548-37526070297c'), img('1581091226825-a6a2a5aee158')],
    'USED'
  ),
  'office-equipment': L(
    'طابعة HP LaserJet + فاكس',
    'HP LaserJet printer + fax',
    'طابعة HP LaserJet Pro، طباعة ومسح ضوئي، حبر جديد.',
    'HP LaserJet Pro printer, print and scan, new toner installed.',
    120,
    [img('1586953208448-b127f0b2b48b'), img('1593640408182-141684e3086c')],
    'USED'
  ),
  'industrial-machinery': L(
    'مولد كهرباء 50 KVA - Caterpillar',
    '50 KVA Caterpillar generator',
    'مولد كهرباء صناعي 50 KVA، ديزل، ساعات تشغيل منخفضة.',
    'Industrial 50 KVA diesel generator, low operating hours.',
    8500,
    [img('1581091226825-a6a2a5aee158'), img('1504328345606-3208431a5712')],
    'USED'
  ),
  'restaurant-equipment': L(
    'فرن بيتزا تجاري - 6 مواقد',
    'Commercial 6-burner pizza oven',
    'فرن بيتza تجاري من الستانلس ستيل، 6 مواقد، حالة تشغيل ممتازة.',
    'Stainless steel commercial pizza oven, 6 burners, excellent working condition.',
    2200,
    [img('1556911220-bff31c812dba'), img('1414235077428-338989a2e8c0')],
    'USED'
  ),

  'food-beverages': L(
    'تمر عماني فاخر - 5kg',
    'Premium Omani dates - 5kg',
    'تمر عماني فاخر، Khalas وFardh، تعبئة هدايا، طازج.',
    'Premium Omani Khalas and Fardh dates, gift packaging, fresh.',
    18,
    [img('1606312619070-d48aeb4a5430'), img('1606312567085-2f4e0b0b0b0b')],
    'NEW'
  ),

  'health-wellness': L(
    'صحة وعافية - عروض تجريبية',
    'Health & wellness demo listings',
    'معدات طبية ومنتجات العافية من بائعين موثوقين.',
    'Medical equipment and wellness products from trusted sellers.',
    85,
    [img('1576091160399-112ba8d25d1f'), img('1505751172876-4a52f5a1d9f1')],
    'NEW'
  ),
  'medical-equipment': L(
    'جهاز قياس ضغط Omron',
    'Omron blood pressure monitor',
    'جهاز قياس ضغط Omron digital، دقة عالية، مع حقيبة، جديد.',
    'Omron digital blood pressure monitor, high accuracy, with case, new.',
    35,
    [img('1576091160399-112ba8d25d1f'), img('1559757172-670b934a1a9d')],
    'NEW'
  ),
  'wellness-products': L(
    'مجموعة فيتامينات و مكملات',
    'Vitamins and supplements bundle',
    'مجموعة فيتامينات D3، Omega-3، وMultivitamin، sealed.',
    'Vitamin D3, Omega-3, and multivitamin bundle, sealed packages.',
    28,
    [img('1505751172876-4a52f5a1d9f1'), img('1556228571-0d85b1a4d571')],
    'NEW'
  ),

  'antiques-collectibles': L(
    'تحف ومقتنيات نادرة',
    'Rare antiques & collectibles',
    'مجموعة تحف عمانية وعملات قديمة وقطع نادرة للهواة.',
    'Omani antiques, vintage coins, and rare collector items.',
    250,
    [img('1563293909001-1e29a2291b10'), img('1578662996442-48f601370fc9')],
    'USED'
  ),
  'art-handcrafts': L(
    'خنجر عماني تقليدي - فضة',
    'Traditional Omani silver khanjar',
    'خنجر عماني يدوي الصنع، فضة أصلية، مع حامل خشبي.',
    'Handcrafted Omani khanjar, genuine silver, with wooden stand.',
    450,
    [img('1586075010929-2dd457a4b0c5'), img('1578662996442-48f601370fc9')],
    'USED'
  ),

  services: L(
    'خدمات متنوعة - عروض تجريبية',
    'Various services - demo listings',
    'خدمات منزلية، صيانة، قانونية، وتجميل من مزودين موثوقين.',
    'Home, maintenance, legal, and beauty services from trusted providers.',
    25,
    [img('1521791136064-7986c2920216'), img('1556761175-b413da4baf72')],
    undefined
  ),
  'home-services': L(
    'خدمات سباكة وكهرباء - 24 ساعة',
    '24/7 plumbing & electrical services',
    'فريق متخصص في السباكة والكهرباء، استجابة سريعة، أسعار منافسة.',
    'Specialist plumbing and electrical team, fast response, competitive rates.',
    15,
    [img('1581574260465-c5a2d1852a2e'), img('1504148455325-c37689a3f6b0')],
    undefined
  ),
  'cleaning-services': L(
    'تنظيف منازل ومكاتب - فريق محترف',
    'Professional home & office cleaning',
    'خدمة تنظيف شاملة للمنازل والمكاتب، مواد صديقة للبيئة، فريق مدرب.',
    'Comprehensive home and office cleaning, eco-friendly products, trained team.',
    20,
    [img('1581574260465-c5a2d1852a2e'), img('1527515635544-4b4b4b4b4b4b')],
    undefined
  ),
  'maintenance-repair': L(
    'صيانة مكيفات وتبريد',
    'AC maintenance & repair',
    'صيانة وإصلاح جميع أنواع المكيفات، تعبئة غاز، ضمان على العمل.',
    'Maintenance and repair for all AC types, gas refill, work guarantee.',
    18,
    [img('1504148455325-c37689a3f6b0'), img('1581094798796-0c285070e0ec')],
    undefined
  ),
  'legal-accounting': L(
    'استشارات قانونية ومحاسبية',
    'Legal & accounting consultancy',
    'مكتب استشارات قانونية ومحاسبية، تأسيس شركات، ضرائب، وعقود.',
    'Legal and accounting consultancy: company setup, taxes, and contracts.',
    50,
    [img('1450101499163-c8848c66ca85'), img('1554224155-6726b3ff858f')],
    undefined
  ),
  'events-catering': L(
    'تموين حفلات ومناسبات',
    'Events catering service',
    'خدمة تموين للحفلات والمناسبات، قوائم متنوعة، طاقم محترف.',
    'Catering for events and celebrations, varied menus, professional staff.',
    8,
    [img('1414235077428-338989a2e8c0'), img('1555244167-011816f4fcd0')],
    undefined
  ),
  'beauty-services': L(
    'صالون تجميل منزلي - سيدات',
    'Mobile beauty salon - ladies',
    'خدمات تجميل منزلية: مكياج، شعر، وعناية بالبشرة، بأدوات معقمة.',
    'Home beauty services: makeup, hair, and skincare with sterilized tools.',
    25,
    [img('1560066984-138d9834c035'), img('1522335789203-aabd1fc54bc9')],
    undefined
  ),
  'education-tutoring': L(
    'دروس خصوصية - رياضيات وفيزياء',
    'Private tutoring - math & physics',
    'مدرس خصوصي لطلاب الثانوية، رياضيات وفيزياء، خبرة 10 سنوات.',
    'Private tutor for high school students, math and physics, 10 years experience.',
    12,
    [img('1503676260728-1c00da094a0b'), img('1523240795612-9a1b222fad5b')],
    undefined
  ),

  jobs: L(
    'محاسب - شركة تجارية - مسقط',
    'Accountant - trading company - Muscat',
    'مطلوب محاسب بخبرة 3 سنوات، إجادة Excel وERP، راتب تنافسي ومزايا.',
    'Accountant needed, 3 years experience, Excel and ERP skills, competitive salary and benefits.',
    900,
    [img('1551836022-d5d88e9218df'), img('1521791136064-7986c2920216')],
    undefined
  ),
  'job-seekers': L(
    'مهندس برمجيات - يبحث عن فرصة',
    'Software engineer seeking opportunity',
    'مهندس برمجيات بخبرة 5 سنوات، React وNode.js، يبحث عن وظيفة بدوام كامل.',
    'Software engineer, 5 years experience in React and Node.js, seeking full-time role.',
    undefined,
    [img('1507003211169-0a1dd7228f2d'), img('1573496359142-b8d87734a5a2')],
    undefined
  ),

  wanted: L(
    'مطلوب للشراء - عروض تجريبية',
    'Wanted to buy - demo listings',
    'إعلانات من مشترين يبحثون عن منتجات وعقارات وسيارات.',
    'Listings from buyers looking for products, property, and vehicles.',
    5000,
    [img('1556742049-0cfed4f6a45d'), img('1554224155-6726b3ff858f')],
    undefined
  ),
  'wanted-cars': L(
    'مطلوب Toyota Camry 2020 أو أحدث',
    'Wanted Toyota Camry 2020 or newer',
    'أبحث عن Toyota Camry موديل 2020 أو أحدث، حالة جيدة، مواصفات خليجية.',
    'Looking for Toyota Camry 2020 or newer, good condition, GCC specs.',
    8000,
    [img('1492144534655-ae79c964c9d7'), img('1549317661-bd32c8ce0db2')],
    undefined
  ),
  'wanted-electronics': L(
    'مطلوب MacBook Pro M2 أو M3',
    'Wanted MacBook Pro M2 or M3',
    'أبحث عن MacBook Pro M2/M3، 16GB RAM على الأقل، حالة جيدة.',
    'Looking for MacBook Pro M2/M3, at least 16GB RAM, good condition.',
    600,
    [img('1496181133206-798ce4d42e4c'), img('1511707171634-5f897ff053aa')],
    undefined
  ),
  'wanted-property': L(
    'مطلوب شقة 2-3 غرف للإيجار - مسقط',
    'Wanted 2-3 bed apartment for rent - Muscat',
    'عائلة تبحث عن شقة 2-3 غرف للإيجار في مسقط، مفروشة، موقع هادئ.',
    'Family seeking furnished 2-3 bed apartment in Muscat, quiet area.',
    500,
    [img('1522708323590-d24dbb6b0267'), img('1560518883-ce09059eeffa')],
    undefined
  ),
  'wanted-other': L(
    'مطلوب دراجة جبلية - مقاس متوسط',
    'Wanted medium-size mountain bike',
    'أبحث عن دراجة جبلية بحالة جيدة، مقاس medium، ميزانية حتى 200 ر.ع.',
    'Looking for a good condition mountain bike, medium size, budget up to 200 OMR.',
    200,
    [img('1485965120648-891e7d2292b3'), img('1576435728670-407d066034da')],
    undefined
  ),

  'training-courses': L(
    'دورات تدريبية - عروض تجريبية',
    'Training courses - demo listings',
    'دورات مهنية ولغات وتقنية أونلاين وحضورياً.',
    'Professional, language, and tech courses online and in-person.',
    80,
    [img('1523240795612-9a1b222fad5b'), img('1503676260728-1c00da094a0b')],
    undefined
  ),
  'professional-courses': L(
    'دورة إدارة مشاريع PMP',
    'PMP project management course',
    'دورة PMP معتمدة، 40 ساعة، مدرب معتمد، شهادة دولية.',
    'Certified PMP course, 40 hours, certified trainer, international certificate.',
    350,
    [img('1454165804606-c3d57bc86b40'), img('1523240795612-9a1b222fad5b')],
    undefined
  ),
  'language-courses': L(
    'دورة لغة إنجليزية - مستوى متقدم',
    'Advanced English language course',
    'دورة إنجليزي للمستوى المتقدم، IELTS preparation، مجموعات صغيرة.',
    'Advanced English course, IELTS preparation, small group classes.',
    120,
    [img('1546410531-48b187587244'), img('1503676260728-1c00da094a0b')],
    undefined
  ),
  'tech-courses': L(
    'دورة Full Stack Web Development',
    'Full Stack Web Development course',
    'دورة برمجة Full Stack: React, Node.js, PostgreSQL، 3 أشهر، مشروع نهائي.',
    'Full Stack course: React, Node.js, PostgreSQL, 3 months, final project.',
    280,
    [img('1516321318423-f06f85e504b3'), img('1498050108023-c5249f4df085')],
    undefined
  ),

  'tourism-trips': L(
    'رحلات سياحية - عروض تجريبية',
    'Tourism & trips - demo listings',
    'رحلات داخلية ودولية وفنادق وإقامة في عمان والعالم.',
    'Domestic and international trips, hotels and stays in Oman and abroad.',
    150,
    [img('1506905925346-21bda4d32df4'), img('1469859671984-ffbb27940e25')],
    undefined
  ),
  'domestic-trips': L(
    'رحلة وادي شاب - يوم كامل',
    'Wadi Shab day trip',
    'رحلة يومية لوادي شاب مع غداء، نقل مكيف، ومرشد سياحي.',
    'Full-day Wadi Shab trip with lunch, AC transport, and tour guide.',
    35,
    [img('1584469125998-50c49c0d2261'), img('1506905925346-21bda4d32df4')],
    undefined
  ),
  'international-trips': L(
    'رحلة دبي - 3 أيام / 2 ليلة',
    'Dubai trip - 3 days / 2 nights',
    'باقة سياحية لدبي: طيران، فندق 4 نجوم، جولة مدينة، إفطار.',
    'Dubai package: flights, 4-star hotel, city tour, breakfast included.',
    180,
    [img('1512453979798-5ea266f8880c'), img('1469859671984-ffbb27940e25')],
    undefined
  ),
  'hotels-stays': L(
    'شاليه فاخر - صلالة - ليلة',
    'Luxury chalet - Salalah - per night',
    'شاليه 3 غرف في صلالة، مسبح خاص، إطلالة على البحر، مناسب للعائلات.',
    '3-bed chalet in Salalah, private pool, sea view, family-friendly.',
    95,
    [img('1566073770509-0e0a0e0e0e0e'), img('1571896349842-33c89424de2d')],
    undefined
  ),

  logistics: L(
    'خدمة توصيل ونقل - مسقط ومحافظات',
    'Delivery & transport - Muscat & governorates',
    'خدمة توصيل محلي وبين المدن، نقل أثاث، شحن بضائع، أسعار منافسة.',
    'Local and intercity delivery, furniture moving, freight shipping, competitive rates.',
    10,
    [img('1601584111076-792c57abce99'), img('1586528116311-ad8dd3c8310d')],
    undefined
  ),

  construction: L(
    'بناء ومقاولات - عروض تجريبية',
    'Construction - demo listings',
    'مواد بناء، خدمات مقاولات، ومعدات بناء.',
    'Building materials, contracting services, and construction equipment.',
    500,
    [img('1504307651254-35680f356dfd'), img('1541888944715-0849d2545124')],
    undefined
  ),
  'building-materials': L(
    'أسمنت وحديد - طلب بالجملة',
    'Cement and steel - bulk order',
    'أسمنت Portland وحديد تسليح، توصيل للموقع، أسعار الجملة.',
    'Portland cement and rebar, site delivery, wholesale prices.',
    250,
    [img('1504307651254-35680f356dfd'), img('1581094798796-0c285070e0ec')],
    'NEW'
  ),
  'construction-services': L(
    'مقاول بناء - تشطيبات كاملة',
    'Building contractor - full finishing',
    'مقاول معتمد لتشطيبات كاملة: سباكة، كهرباء، بلاط، ودهان.',
    'Certified contractor for full finishing: plumbing, electrical, tiling, and painting.',
    5000,
    [img('1541888944715-0849d2545124'), img('1504148455325-c37689a3f6b0')],
    undefined
  ),
  'construction-tools': L(
    'عدة بناء Bosch Professional',
    'Bosch Professional construction kit',
    'عدة Bosch Professional: Perforator، منشار، ومسطح، مع حقيبة.',
    'Bosch Professional kit: rotary hammer, saw, and level, with case.',
    380,
    [img('1504148455325-c37689a3f6b0'), img('1581094798796-0c285070e0ec')],
    'USED'
  )
};

module.exports = { DEMO_LISTING_CONTENT, img, L };
