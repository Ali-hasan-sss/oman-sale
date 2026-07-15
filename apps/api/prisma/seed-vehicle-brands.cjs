/** @typedef {{ slug: string; parentSlug?: string | null; nameAr: string; nameEn: string; icon: string; type: string; sortOrder: number }} CategoryDef */

/** @param {string} text */
function hasMixedScript(text) {
  return /[\u0600-\u06FF][A-Za-z]/.test(text) || /[A-Za-z][\u0600-\u06FF]/.test(text);
}

/** @param {{ nameAr: string; nameEn: string }} item */
function resolveNameAr(item) {
  if (!item.nameAr || hasMixedScript(item.nameAr)) return item.nameEn;
  return item.nameAr;
}

/** @type {Record<string, string>} */
const BRAND_NAMES_AR = {
  gmc: 'جي إم سي',
  dodge: 'دودج',
  geely: 'جيلي',
  haval: 'هافال',
  tesla: 'تيسلا',
  cadillac: 'كاديلاك',
  infiniti: 'إنفينيتي',
  genesis: 'جنيسيس',
  ssangyong: 'سانغيونج',
  mg: 'إم جي',
  byd: 'بي واي دي',
  ktm: 'كي تي إم',
  cfmoto: 'سي إف موتو'
};

/** @param {{ slug: string; nameAr: string; nameEn: string }} brand */
function resolveBrandNameAr(brand) {
  if (BRAND_NAMES_AR[brand.slug]) return BRAND_NAMES_AR[brand.slug];
  if (!brand.nameAr || hasMixedScript(brand.nameAr)) return brand.nameEn;
  if (brand.nameAr === brand.slug || /^[a-z0-9-]+$/i.test(brand.nameAr)) return brand.nameEn;
  return brand.nameAr;
}

/** @param {{ slug: string; nameAr: string; nameEn: string; icon?: string; models: { slug: string; nameAr: string; nameEn: string }[] }} brand */
function buildBrandBranch(prefix, parentSlug, brand, sortOrder) {
  /** @type {CategoryDef[]} */
  const defs = [];
  const brandSlug = `${prefix}-brand-${brand.slug}`;

  defs.push({
    slug: brandSlug,
    parentSlug,
    nameAr: resolveBrandNameAr(brand),
    nameEn: brand.nameEn,
    icon: brand.icon ?? '🚗',
    type: 'PRODUCT',
    sortOrder
  });

  brand.models.forEach((model, index) => {
    defs.push({
      slug: `${prefix}-model-${brand.slug}-${model.slug}`,
      parentSlug: brandSlug,
      nameAr: resolveNameAr(model),
      nameEn: model.nameEn,
      icon: brand.icon ?? '🚗',
      type: 'PRODUCT',
      sortOrder: (index + 1) * 10
    });
  });

  return defs;
}

/** @param {string} prefix @param {string} parentSlug @param {Array<{ slug: string; nameAr: string; nameEn: string; icon?: string; models: { slug: string; nameAr: string; nameEn: string }[] }>} brands @param {number} sortStart */
function buildBrandTree(prefix, parentSlug, brands, sortStart = 10) {
  /** @type {CategoryDef[]} */
  const defs = [];
  let order = sortStart;

  for (const brand of brands) {
    defs.push(...buildBrandBranch(prefix, parentSlug, brand, order));
    order += 10;
  }

  return defs;
}

const carBrands = [
  {
    slug: 'toyota',
    nameAr: 'تويوتا',
    nameEn: 'Toyota',
    icon: '🔴',
    models: [
      { slug: 'camry', nameAr: 'كامري', nameEn: 'Camry' },
      { slug: 'corolla', nameAr: 'كورولا', nameEn: 'Corolla' },
      { slug: 'yaris', nameAr: 'يارس', nameEn: 'Yaris' },
      { slug: 'land-cruiser', nameAr: 'لاند كروزر', nameEn: 'Land Cruiser' },
      { slug: 'prado', nameAr: 'برادو', nameEn: 'Prado' },
      { slug: 'hilux', nameAr: 'هايلكس', nameEn: 'Hilux' },
      { slug: 'fortuner', nameAr: 'فورتشنر', nameEn: 'Fortuner' },
      { slug: 'rav4', nameAr: 'RAV4', nameEn: 'RAV4' },
      { slug: 'avalon', nameAr: 'أفالون', nameEn: 'Avalon' },
      { slug: 'supra', nameAr: 'سوبرا', nameEn: 'Supra' },
      { slug: 'c-hr', nameAr: 'C-HR', nameEn: 'C-HR' },
      { slug: 'highlander', nameAr: 'هايلاندر', nameEn: 'Highlander' },
      { slug: 'sequoia', nameAr: 'سيكويا', nameEn: 'Sequoia' },
      { slug: '86', nameAr: '86 / GR86', nameEn: '86 / GR86' }
    ]
  },
  {
    slug: 'nissan',
    nameAr: 'نيسان',
    nameEn: 'Nissan',
    icon: '🔵',
    models: [
      { slug: 'altima', nameAr: 'ألتيما', nameEn: 'Altima' },
      { slug: 'sunny', nameAr: 'صني', nameEn: 'Sunny' },
      { slug: 'patrol', nameAr: 'باترول', nameEn: 'Patrol' },
      { slug: 'x-trail', nameAr: 'X-Trail', nameEn: 'X-Trail' },
      { slug: 'kicks', nameAr: 'Kicks', nameEn: 'Kicks' },
      { slug: 'pathfinder', nameAr: 'Pathfinder', nameEn: 'Pathfinder' },
      { slug: 'navara', nameAr: 'Navara', nameEn: 'Navara' },
      { slug: 'maxima', nameAr: 'Maxima', nameEn: 'Maxima' },
      { slug: 'sentra', nameAr: 'Sentra', nameEn: 'Sentra' },
      { slug: 'urvan', nameAr: 'Urvan', nameEn: 'Urvan' },
      { slug: 'z', nameAr: 'Z', nameEn: 'Z' }
    ]
  },
  {
    slug: 'honda',
    nameAr: 'هوندا',
    nameEn: 'Honda',
    icon: '🔴',
    models: [
      { slug: 'accord', nameAr: 'أكورد', nameEn: 'Accord' },
      { slug: 'civic', nameAr: 'سيفيك', nameEn: 'Civic' },
      { slug: 'cr-v', nameAr: 'CR-V', nameEn: 'CR-V' },
      { slug: 'pilot', nameAr: 'Pilot', nameEn: 'Pilot' },
      { slug: 'hr-v', nameAr: 'HR-V', nameEn: 'HR-V' },
      { slug: 'city', nameAr: 'City', nameEn: 'City' },
      { slug: 'odyssey', nameAr: 'Odyssey', nameEn: 'Odyssey' },
      { slug: 'passport', nameAr: 'Passport', nameEn: 'Passport' }
    ]
  },
  {
    slug: 'hyundai',
    nameAr: 'هيونداي',
    nameEn: 'Hyundai',
    icon: '🔵',
    models: [
      { slug: 'elantra', nameAr: 'إلنترا', nameEn: 'Elantra' },
      { slug: 'sonata', nameAr: 'سوناتا', nameEn: 'Sonata' },
      { slug: 'tucson', nameAr: 'Tucson', nameEn: 'Tucson' },
      { slug: 'santa-fe', nameAr: 'Santa Fe', nameEn: 'Santa Fe' },
      { slug: 'accent', nameAr: 'Accent', nameEn: 'Accent' },
      { slug: 'creta', nameAr: 'Creta', nameEn: 'Creta' },
      { slug: 'palisade', nameAr: 'Palisade', nameEn: 'Palisade' },
      { slug: 'kona', nameAr: 'Kona', nameEn: 'Kona' },
      { slug: 'azera', nameAr: 'Azera', nameEn: 'Azera' },
      { slug: 'staria', nameAr: 'Staria', nameEn: 'Staria' }
    ]
  },
  {
    slug: 'kia',
    nameAr: 'كيا',
    nameEn: 'Kia',
    icon: '🔴',
    models: [
      { slug: 'sportage', nameAr: 'Sportage', nameEn: 'Sportage' },
      { slug: 'sorento', nameAr: 'Sorento', nameEn: 'Sorento' },
      { slug: 'cerato', nameAr: 'Cerato', nameEn: 'Cerato' },
      { slug: 'picanto', nameAr: 'Picanto', nameEn: 'Picanto' },
      { slug: 'carnival', nameAr: 'Carnival', nameEn: 'Carnival' },
      { slug: 'seltos', nameAr: 'Seltos', nameEn: 'Seltos' },
      { slug: 'k5', nameAr: 'K5', nameEn: 'K5' },
      { slug: 'telluride', nameAr: 'Telluride', nameEn: 'Telluride' },
      { slug: 'ev6', nameAr: 'EV6', nameEn: 'EV6' }
    ]
  },
  {
    slug: 'lexus',
    nameAr: 'لكزس',
    nameEn: 'Lexus',
    icon: '⚫',
    models: [
      { slug: 'es', nameAr: 'ES', nameEn: 'ES' },
      { slug: 'ls', nameAr: 'LS', nameEn: 'LS' },
      { slug: 'rx', nameAr: 'RX', nameEn: 'RX' },
      { slug: 'lx', nameAr: 'LX', nameEn: 'LX' },
      { slug: 'nx', nameAr: 'NX', nameEn: 'NX' },
      { slug: 'is', nameAr: 'IS', nameEn: 'IS' },
      { slug: 'gx', nameAr: 'GX', nameEn: 'GX' },
      { slug: 'ux', nameAr: 'UX', nameEn: 'UX' },
      { slug: 'lc', nameAr: 'LC', nameEn: 'LC' }
    ]
  },
  {
    slug: 'bmw',
    nameAr: 'بي إم دبليو',
    nameEn: 'BMW',
    icon: '🔵',
    models: [
      { slug: '3-series', nameAr: 'السلسلة 3', nameEn: '3 Series' },
      { slug: '5-series', nameAr: 'السلسلة 5', nameEn: '5 Series' },
      { slug: '7-series', nameAr: 'السلسلة 7', nameEn: '7 Series' },
      { slug: 'x3', nameAr: 'X3', nameEn: 'X3' },
      { slug: 'x5', nameAr: 'X5', nameEn: 'X5' },
      { slug: 'x7', nameAr: 'X7', nameEn: 'X7' },
      { slug: 'x6', nameAr: 'X6', nameEn: 'X6' },
      { slug: 'm3', nameAr: 'M3', nameEn: 'M3' },
      { slug: 'm5', nameAr: 'M5', nameEn: 'M5' },
      { slug: 'i4', nameAr: 'i4', nameEn: 'i4' },
      { slug: 'i7', nameAr: 'i7', nameEn: 'i7' }
    ]
  },
  {
    slug: 'mercedes',
    nameAr: 'مرسيدس',
    nameEn: 'Mercedes-Benz',
    icon: '⭐',
    models: [
      { slug: 'c-class', nameAr: 'فئة C', nameEn: 'C-Class' },
      { slug: 'e-class', nameAr: 'فئة E', nameEn: 'E-Class' },
      { slug: 's-class', nameAr: 'فئة S', nameEn: 'S-Class' },
      { slug: 'g-class', nameAr: 'فئة G', nameEn: 'G-Class' },
      { slug: 'glc', nameAr: 'GLC', nameEn: 'GLC' },
      { slug: 'gle', nameAr: 'GLE', nameEn: 'GLE' },
      { slug: 'gls', nameAr: 'GLS', nameEn: 'GLS' },
      { slug: 'a-class', nameAr: 'فئة A', nameEn: 'A-Class' },
      { slug: 'cla', nameAr: 'CLA', nameEn: 'CLA' },
      { slug: 'amg-gt', nameAr: 'AMG GT', nameEn: 'AMG GT' },
      { slug: 'maybach', nameAr: 'Maybach', nameEn: 'Maybach' }
    ]
  },
  {
    slug: 'audi',
    nameAr: 'أودي',
    nameEn: 'Audi',
    icon: '⚫',
    models: [
      { slug: 'a3', nameAr: 'A3', nameEn: 'A3' },
      { slug: 'a4', nameAr: 'A4', nameEn: 'A4' },
      { slug: 'a6', nameAr: 'A6', nameEn: 'A6' },
      { slug: 'a8', nameAr: 'A8', nameEn: 'A8' },
      { slug: 'q3', nameAr: 'Q3', nameEn: 'Q3' },
      { slug: 'q5', nameAr: 'Q5', nameEn: 'Q5' },
      { slug: 'q7', nameAr: 'Q7', nameEn: 'Q7' },
      { slug: 'q8', nameAr: 'Q8', nameEn: 'Q8' },
      { slug: 'e-tron', nameAr: 'e-tron', nameEn: 'e-tron' },
      { slug: 'rs6', nameAr: 'RS6', nameEn: 'RS6' }
    ]
  },
  {
    slug: 'ford',
    nameAr: 'فورد',
    nameEn: 'Ford',
    icon: '🔵',
    models: [
      { slug: 'explorer', nameAr: 'Explorer', nameEn: 'Explorer' },
      { slug: 'expedition', nameAr: 'Expedition', nameEn: 'Expedition' },
      { slug: 'f-150', nameAr: 'F-150', nameEn: 'F-150' },
      { slug: 'mustang', nameAr: 'Mustang', nameEn: 'Mustang' },
      { slug: 'edge', nameAr: 'Edge', nameEn: 'Edge' },
      { slug: 'escape', nameAr: 'Escape', nameEn: 'Escape' },
      { slug: 'ranger', nameAr: 'Ranger', nameEn: 'Ranger' },
      { slug: 'bronco', nameAr: 'Bronco', nameEn: 'Bronco' },
      { slug: 'territory', nameAr: 'Territory', nameEn: 'Territory' }
    ]
  },
  {
    slug: 'chevrolet',
    nameAr: 'شيفروليه',
    nameEn: 'Chevrolet',
    icon: '🟡',
    models: [
      { slug: 'tahoe', nameAr: 'Tahoe', nameEn: 'Tahoe' },
      { slug: 'suburban', nameAr: 'Suburban', nameEn: 'Suburban' },
      { slug: 'silverado', nameAr: 'Silverado', nameEn: 'Silverado' },
      { slug: 'camaro', nameAr: 'Camaro', nameEn: 'Camaro' },
      { slug: 'malibu', nameAr: 'Malibu', nameEn: 'Malibu' },
      { slug: 'traverse', nameAr: 'Traverse', nameEn: 'Traverse' },
      { slug: 'blazer', nameAr: 'Blazer', nameEn: 'Blazer' },
      { slug: 'captiva', nameAr: 'Captiva', nameEn: 'Captiva' },
      { slug: 'corvette', nameAr: 'Corvette', nameEn: 'Corvette' }
    ]
  },
  {
    slug: 'gmc',
    nameAr: 'GMC',
    nameEn: 'GMC',
    icon: '🔴',
    models: [
      { slug: 'yukon', nameAr: 'Yukon', nameEn: 'Yukon' },
      { slug: 'sierra', nameAr: 'Sierra', nameEn: 'Sierra' },
      { slug: 'acadia', nameAr: 'Acadia', nameEn: 'Acadia' },
      { slug: 'terrain', nameAr: 'Terrain', nameEn: 'Terrain' },
      { slug: 'hummer-ev', nameAr: 'Hummer EV', nameEn: 'Hummer EV' }
    ]
  },
  {
    slug: 'dodge',
    nameAr: 'دodge',
    nameEn: 'Dodge',
    icon: '🔴',
    models: [
      { slug: 'charger', nameAr: 'Charger', nameEn: 'Charger' },
      { slug: 'challenger', nameAr: 'Challenger', nameEn: 'Challenger' },
      { slug: 'durango', nameAr: 'Durango', nameEn: 'Durango' },
      { slug: 'ram', nameAr: 'RAM', nameEn: 'RAM' }
    ]
  },
  {
    slug: 'jeep',
    nameAr: 'جيب',
    nameEn: 'Jeep',
    icon: '🟢',
    models: [
      { slug: 'wrangler', nameAr: 'Wrangler', nameEn: 'Wrangler' },
      { slug: 'grand-cherokee', nameAr: 'Grand Cherokee', nameEn: 'Grand Cherokee' },
      { slug: 'cherokee', nameAr: 'Cherokee', nameEn: 'Cherokee' },
      { slug: 'compass', nameAr: 'Compass', nameEn: 'Compass' },
      { slug: 'gladiator', nameAr: 'Gladiator', nameEn: 'Gladiator' },
      { slug: 'renegade', nameAr: 'Renegade', nameEn: 'Renegade' }
    ]
  },
  {
    slug: 'mitsubishi',
    nameAr: 'ميتسوبيشي',
    nameEn: 'Mitsubishi',
    icon: '🔴',
    models: [
      { slug: 'pajero', nameAr: 'Pajero', nameEn: 'Pajero' },
      { slug: 'l200', nameAr: 'L200', nameEn: 'L200' },
      { slug: 'outlander', nameAr: 'Outlander', nameEn: 'Outlander' },
      { slug: 'attrage', nameAr: 'Attrage', nameEn: 'Attrage' },
      { slug: 'eclipse-cross', nameAr: 'Eclipse Cross', nameEn: 'Eclipse Cross' },
      { slug: 'asx', nameAr: 'ASX', nameEn: 'ASX' },
      { slug: 'montero', nameAr: 'Montero', nameEn: 'Montero' }
    ]
  },
  {
    slug: 'mazda',
    nameAr: 'مازدا',
    nameEn: 'Mazda',
    icon: '🔴',
    models: [
      { slug: 'cx-5', nameAr: 'CX-5', nameEn: 'CX-5' },
      { slug: 'cx-9', nameAr: 'CX-9', nameEn: 'CX-9' },
      { slug: 'cx-30', nameAr: 'CX-30', nameEn: 'CX-30' },
      { slug: 'mazda3', nameAr: 'Mazda3', nameEn: 'Mazda3' },
      { slug: 'mazda6', nameAr: 'Mazda6', nameEn: 'Mazda6' },
      { slug: 'mx-5', nameAr: 'MX-5', nameEn: 'MX-5' },
      { slug: 'cx-60', nameAr: 'CX-60', nameEn: 'CX-60' }
    ]
  },
  {
    slug: 'suzuki',
    nameAr: 'سوزوكي',
    nameEn: 'Suzuki',
    icon: '🔵',
    models: [
      { slug: 'swift', nameAr: 'Swift', nameEn: 'Swift' },
      { slug: 'vitara', nameAr: 'Vitara', nameEn: 'Vitara' },
      { slug: 'jimny', nameAr: 'Jimny', nameEn: 'Jimny' },
      { slug: 'baleno', nameAr: 'Baleno', nameEn: 'Baleno' },
      { slug: 'ertiga', nameAr: 'Ertiga', nameEn: 'Ertiga' },
      { slug: 'dzire', nameAr: 'Dzire', nameEn: 'Dzire' }
    ]
  },
  {
    slug: 'isuzu',
    nameAr: 'إيسوزو',
    nameEn: 'Isuzu',
    icon: '🔴',
    models: [
      { slug: 'd-max', nameAr: 'D-Max', nameEn: 'D-Max' },
      { slug: 'mu-x', nameAr: 'MU-X', nameEn: 'MU-X' }
    ]
  },
  {
    slug: 'land-rover',
    nameAr: 'لاند روفر',
    nameEn: 'Land Rover',
    icon: '🟢',
    models: [
      { slug: 'range-rover', nameAr: 'Range Rover', nameEn: 'Range Rover' },
      { slug: 'range-rover-sport', nameAr: 'Range Rover Sport', nameEn: 'Range Rover Sport' },
      { slug: 'discovery', nameAr: 'Discovery', nameEn: 'Discovery' },
      { slug: 'defender', nameAr: 'Defender', nameEn: 'Defender' },
      { slug: 'evoque', nameAr: 'Evoque', nameEn: 'Evoque' },
      { slug: 'velar', nameAr: 'Velar', nameEn: 'Velar' }
    ]
  },
  {
    slug: 'porsche',
    nameAr: 'بورش',
    nameEn: 'Porsche',
    icon: '🏎️',
    models: [
      { slug: 'cayenne', nameAr: 'Cayenne', nameEn: 'Cayenne' },
      { slug: 'macan', nameAr: 'Macan', nameEn: 'Macan' },
      { slug: '911', nameAr: '911', nameEn: '911' },
      { slug: 'panamera', nameAr: 'Panamera', nameEn: 'Panamera' },
      { slug: 'taycan', nameAr: 'Taycan', nameEn: 'Taycan' }
    ]
  },
  {
    slug: 'volvo',
    nameAr: 'volvo',
    nameEn: 'Volvo',
    icon: '🔵',
    models: [
      { slug: 'xc90', nameAr: 'XC90', nameEn: 'XC90' },
      { slug: 'xc60', nameAr: 'XC60', nameEn: 'XC60' },
      { slug: 'xc40', nameAr: 'XC40', nameEn: 'XC40' },
      { slug: 's90', nameAr: 'S90', nameEn: 'S90' },
      { slug: 's60', nameAr: 'S60', nameEn: 'S60' }
    ]
  },
  {
    slug: 'peugeot',
    nameAr: 'peugeot',
    nameEn: 'Peugeot',
    icon: '🦁',
    models: [
      { slug: '3008', nameAr: '3008', nameEn: '3008' },
      { slug: '508', nameAr: '508', nameEn: '508' },
      { slug: '2008', nameAr: '2008', nameEn: '2008' },
      { slug: '5008', nameAr: '5008', nameEn: '5008' },
      { slug: '208', nameAr: '208', nameEn: '208' }
    ]
  },
  {
    slug: 'renault',
    nameAr: 'renault',
    nameEn: 'Renault',
    icon: '🟡',
    models: [
      { slug: 'duster', nameAr: 'Duster', nameEn: 'Duster' },
      { slug: 'koleos', nameAr: 'Koleos', nameEn: 'Koleos' },
      { slug: 'megane', nameAr: 'Megane', nameEn: 'Megane' },
      { slug: 'symbol', nameAr: 'Symbol', nameEn: 'Symbol' },
      { slug: 'captur', nameAr: 'Captur', nameEn: 'Captur' }
    ]
  },
  {
    slug: 'mg',
    nameAr: 'MG',
    nameEn: 'MG',
    icon: '🔴',
    models: [
      { slug: 'mg5', nameAr: 'MG5', nameEn: 'MG5' },
      { slug: 'mg6', nameAr: 'MG6', nameEn: 'MG6' },
      { slug: 'zs', nameAr: 'ZS', nameEn: 'ZS' },
      { slug: 'hs', nameAr: 'HS', nameEn: 'HS' },
      { slug: 'rx8', nameAr: 'RX8', nameEn: 'RX8' },
      { slug: 'one', nameAr: 'ONE', nameEn: 'ONE' }
    ]
  },
  {
    slug: 'geely',
    nameAr: 'جili',
    nameEn: 'Geely',
    icon: '🔵',
    models: [
      { slug: 'coolray', nameAr: 'Coolray', nameEn: 'Coolray' },
      { slug: 'emgrand', nameAr: 'Emgrand', nameEn: 'Emgrand' },
      { slug: 'monjaro', nameAr: 'Monjaro', nameEn: 'Monjaro' },
      { slug: 'tugella', nameAr: 'Tugella', nameEn: 'Tugella' }
    ]
  },
  {
    slug: 'changan',
    nameAr: 'شangan',
    nameEn: 'Changan',
    icon: '🔵',
    models: [
      { slug: 'cs35', nameAr: 'CS35', nameEn: 'CS35' },
      { slug: 'cs75', nameAr: 'CS75', nameEn: 'CS75' },
      { slug: 'uni-k', nameAr: 'UNI-K', nameEn: 'UNI-K' },
      { slug: 'uni-t', nameAr: 'UNI-T', nameEn: 'UNI-T' },
      { slug: 'alsvin', nameAr: 'Alsvin', nameEn: 'Alsvin' }
    ]
  },
  {
    slug: 'chery',
    nameAr: 'شيري',
    nameEn: 'Chery',
    icon: '🔴',
    models: [
      { slug: 'tiggo-2', nameAr: 'Tiggo 2', nameEn: 'Tiggo 2' },
      { slug: 'tiggo-4', nameAr: 'Tiggo 4', nameEn: 'Tiggo 4' },
      { slug: 'tiggo-7', nameAr: 'Tiggo 7', nameEn: 'Tiggo 7' },
      { slug: 'tiggo-8', nameAr: 'Tiggo 8', nameEn: 'Tiggo 8' },
      { slug: 'arrizo-6', nameAr: 'Arrizo 6', nameEn: 'Arrizo 6' }
    ]
  },
  {
    slug: 'haval',
    nameAr: 'هاval',
    nameEn: 'Haval',
    icon: '🔴',
    models: [
      { slug: 'h6', nameAr: 'H6', nameEn: 'H6' },
      { slug: 'jolion', nameAr: 'Jolion', nameEn: 'Jolion' },
      { slug: 'h9', nameAr: 'H9', nameEn: 'H9' },
      { slug: 'dargo', nameAr: 'Dargo', nameEn: 'Dargo' }
    ]
  },
  {
    slug: 'byd',
    nameAr: 'BYD',
    nameEn: 'BYD',
    icon: '⚡',
    models: [
      { slug: 'atto-3', nameAr: 'Atto 3', nameEn: 'Atto 3' },
      { slug: 'han', nameAr: 'Han', nameEn: 'Han' },
      { slug: 'seal', nameAr: 'Seal', nameEn: 'Seal' },
      { slug: 'tang', nameAr: 'Tang', nameEn: 'Tang' },
      { slug: 'dolphin', nameAr: 'Dolphin', nameEn: 'Dolphin' }
    ]
  },
  {
    slug: 'tesla',
    nameAr: 'تesla',
    nameEn: 'Tesla',
    icon: '⚡',
    models: [
      { slug: 'model-3', nameAr: 'Model 3', nameEn: 'Model 3' },
      { slug: 'model-y', nameAr: 'Model Y', nameEn: 'Model Y' },
      { slug: 'model-s', nameAr: 'Model S', nameEn: 'Model S' },
      { slug: 'model-x', nameAr: 'Model X', nameEn: 'Model X' },
      { slug: 'cybertruck', nameAr: 'Cybertruck', nameEn: 'Cybertruck' }
    ]
  },
  {
    slug: 'cadillac',
    nameAr: 'كadillac',
    nameEn: 'Cadillac',
    icon: '⭐',
    models: [
      { slug: 'escalade', nameAr: 'Escalade', nameEn: 'Escalade' },
      { slug: 'xt5', nameAr: 'XT5', nameEn: 'XT5' },
      { slug: 'xt6', nameAr: 'XT6', nameEn: 'XT6' },
      { slug: 'ct5', nameAr: 'CT5', nameEn: 'CT5' }
    ]
  },
  {
    slug: 'infiniti',
    nameAr: 'إinfiniti',
    nameEn: 'Infiniti',
    icon: '⚫',
    models: [
      { slug: 'qx80', nameAr: 'QX80', nameEn: 'QX80' },
      { slug: 'qx60', nameAr: 'QX60', nameEn: 'QX60' },
      { slug: 'qx50', nameAr: 'QX50', nameEn: 'QX50' },
      { slug: 'q50', nameAr: 'Q50', nameEn: 'Q50' }
    ]
  },
  {
    slug: 'genesis',
    nameAr: 'جenesis',
    nameEn: 'Genesis',
    icon: '⚫',
    models: [
      { slug: 'g70', nameAr: 'G70', nameEn: 'G70' },
      { slug: 'g80', nameAr: 'G80', nameEn: 'G80' },
      { slug: 'g90', nameAr: 'G90', nameEn: 'G90' },
      { slug: 'gv70', nameAr: 'GV70', nameEn: 'GV70' },
      { slug: 'gv80', nameAr: 'GV80', nameEn: 'GV80' }
    ]
  },
  {
    slug: 'ssangyong',
    nameAr: 'سانgyong',
    nameEn: 'SsangYong',
    icon: '🔵',
    models: [
      { slug: 'rexton', nameAr: 'Rexton', nameEn: 'Rexton' },
      { slug: 'tivoli', nameAr: 'Tivoli', nameEn: 'Tivoli' },
      { slug: 'korando', nameAr: 'Korando', nameEn: 'Korando' },
      { slug: 'musso', nameAr: 'Musso', nameEn: 'Musso' }
    ]
  },
  {
    slug: 'proton',
    nameAr: 'proton',
    nameEn: 'Proton',
    icon: '🔵',
    models: [
      { slug: 'saga', nameAr: 'Saga', nameEn: 'Saga' },
      { slug: 'x50', nameAr: 'X50', nameEn: 'X50' },
      { slug: 'x70', nameAr: 'X70', nameEn: 'X70' },
      { slug: 'persona', nameAr: 'Persona', nameEn: 'Persona' }
    ]
  },
  {
    slug: 'lincoln',
    nameAr: 'lincoln',
    nameEn: 'Lincoln',
    icon: '⭐',
    models: [
      { slug: 'navigator', nameAr: 'Navigator', nameEn: 'Navigator' },
      { slug: 'aviator', nameAr: 'Aviator', nameEn: 'Aviator' },
      { slug: 'nautilus', nameAr: 'Nautilus', nameEn: 'Nautilus' },
      { slug: 'corsair', nameAr: 'Corsair', nameEn: 'Corsair' }
    ]
  },
  {
    slug: 'bentley',
    nameAr: 'bentley',
    nameEn: 'Bentley',
    icon: '👑',
    models: [
      { slug: 'bentayga', nameAr: 'Bentayga', nameEn: 'Bentayga' },
      { slug: 'continental-gt', nameAr: 'Continental GT', nameEn: 'Continental GT' },
      { slug: 'flying-spur', nameAr: 'Flying Spur', nameEn: 'Flying Spur' }
    ]
  },
  {
    slug: 'rolls-royce',
    nameAr: 'rolls-royce',
    nameEn: 'Rolls-Royce',
    icon: '👑',
    models: [
      { slug: 'phantom', nameAr: 'Phantom', nameEn: 'Phantom' },
      { slug: 'ghost', nameAr: 'Ghost', nameEn: 'Ghost' },
      { slug: 'cullinan', nameAr: 'Cullinan', nameEn: 'Cullinan' },
      { slug: 'spectre', nameAr: 'Spectre', nameEn: 'Spectre' }
    ]
  },
  {
    slug: 'lamborghini',
    nameAr: 'lamborghini',
    nameEn: 'Lamborghini',
    icon: '🐂',
    models: [
      { slug: 'urus', nameAr: 'Urus', nameEn: 'Urus' },
      { slug: 'huracan', nameAr: 'Huracán', nameEn: 'Huracán' },
      { slug: 'revuelto', nameAr: 'Revuelto', nameEn: 'Revuelto' }
    ]
  },
  {
    slug: 'ferrari',
    nameAr: 'ferrari',
    nameEn: 'Ferrari',
    icon: '🐎',
    models: [
      { slug: 'purosangue', nameAr: 'Purosangue', nameEn: 'Purosangue' },
      { slug: 'roma', nameAr: 'Roma', nameEn: 'Roma' },
      { slug: '296-gtb', nameAr: '296 GTB', nameEn: '296 GTB' },
      { slug: 'sf90', nameAr: 'SF90', nameEn: 'SF90' }
    ]
  },
  {
    slug: 'other',
    nameAr: 'ماركات أخرى',
    nameEn: 'Other Brands',
    icon: '🚗',
    models: [{ slug: 'other', nameAr: 'موديل آخر', nameEn: 'Other Model' }]
  }
];

const motorcycleBrands = [
  {
    slug: 'honda',
    nameAr: 'هوندا',
    nameEn: 'Honda',
    icon: '🔴',
    models: [
      { slug: 'cbr600', nameAr: 'CBR600', nameEn: 'CBR600' },
      { slug: 'cbr1000', nameAr: 'CBR1000RR', nameEn: 'CBR1000RR' },
      { slug: 'cb500', nameAr: 'CB500', nameEn: 'CB500' },
      { slug: 'cb650', nameAr: 'CB650R', nameEn: 'CB650R' },
      { slug: 'gold-wing', nameAr: 'Gold Wing', nameEn: 'Gold Wing' },
      { slug: 'africa-twin', nameAr: 'Africa Twin', nameEn: 'Africa Twin' },
      { slug: 'pcx', nameAr: 'PCX', nameEn: 'PCX' },
      { slug: 'click', nameAr: 'Click', nameEn: 'Click' },
      { slug: 'dio', nameAr: 'Dio', nameEn: 'Dio' },
      { slug: 'xr150', nameAr: 'XR150', nameEn: 'XR150' },
      { slug: 'crf', nameAr: 'CRF', nameEn: 'CRF' }
    ]
  },
  {
    slug: 'yamaha',
    nameAr: 'yamaha',
    nameEn: 'Yamaha',
    icon: '🔵',
    models: [
      { slug: 'r1', nameAr: 'YZF-R1', nameEn: 'YZF-R1' },
      { slug: 'r6', nameAr: 'YZF-R6', nameEn: 'YZF-R6' },
      { slug: 'r3', nameAr: 'YZF-R3', nameEn: 'YZF-R3' },
      { slug: 'mt-07', nameAr: 'MT-07', nameEn: 'MT-07' },
      { slug: 'mt-09', nameAr: 'MT-09', nameEn: 'MT-09' },
      { slug: 'mt-03', nameAr: 'MT-03', nameEn: 'MT-03' },
      { slug: 'xmax', nameAr: 'XMAX', nameEn: 'XMAX' },
      { slug: 'nmax', nameAr: 'NMAX', nameEn: 'NMAX' },
      { slug: 'tenere', nameAr: 'Ténéré', nameEn: 'Ténéré' },
      { slug: 'tracer', nameAr: 'Tracer', nameEn: 'Tracer' }
    ]
  },
  {
    slug: 'kawasaki',
    nameAr: 'kawasaki',
    nameEn: 'Kawasaki',
    icon: '🟢',
    models: [
      { slug: 'ninja-400', nameAr: 'Ninja 400', nameEn: 'Ninja 400' },
      { slug: 'ninja-650', nameAr: 'Ninja 650', nameEn: 'Ninja 650' },
      { slug: 'ninja-zx10', nameAr: 'Ninja ZX-10R', nameEn: 'Ninja ZX-10R' },
      { slug: 'z900', nameAr: 'Z900', nameEn: 'Z900' },
      { slug: 'z650', nameAr: 'Z650', nameEn: 'Z650' },
      { slug: 'versys', nameAr: 'Versys', nameEn: 'Versys' },
      { slug: 'vulcan', nameAr: 'Vulcan', nameEn: 'Vulcan' },
      { slug: 'klx', nameAr: 'KLX', nameEn: 'KLX' }
    ]
  },
  {
    slug: 'suzuki',
    nameAr: 'سوزوكي',
    nameEn: 'Suzuki',
    icon: '🔵',
    models: [
      { slug: 'gsx-r600', nameAr: 'GSX-R600', nameEn: 'GSX-R600' },
      { slug: 'gsx-r1000', nameAr: 'GSX-R1000', nameEn: 'GSX-R1000' },
      { slug: 'hayabusa', nameAr: 'Hayabusa', nameEn: 'Hayabusa' },
      { slug: 'v-strom', nameAr: 'V-Strom', nameEn: 'V-Strom' },
      { slug: 'burgman', nameAr: 'Burgman', nameEn: 'Burgman' },
      { slug: 'gsx-s750', nameAr: 'GSX-S750', nameEn: 'GSX-S750' },
      { slug: 'address', nameAr: 'Address', nameEn: 'Address' }
    ]
  },
  {
    slug: 'bmw',
    nameAr: 'بي إم دبليو',
    nameEn: 'BMW Motorrad',
    icon: '🔵',
    models: [
      { slug: 'r1250gs', nameAr: 'R1250GS', nameEn: 'R1250GS' },
      { slug: 's1000rr', nameAr: 'S1000RR', nameEn: 'S1000RR' },
      { slug: 'f850gs', nameAr: 'F850GS', nameEn: 'F850GS' },
      { slug: 'f900r', nameAr: 'F900R', nameEn: 'F900R' },
      { slug: 'r-nine-t', nameAr: 'R nineT', nameEn: 'R nineT' },
      { slug: 'g310r', nameAr: 'G310R', nameEn: 'G310R' }
    ]
  },
  {
    slug: 'ducati',
    nameAr: 'ducati',
    nameEn: 'Ducati',
    icon: '🔴',
    models: [
      { slug: 'panigale', nameAr: 'Panigale', nameEn: 'Panigale' },
      { slug: 'monster', nameAr: 'Monster', nameEn: 'Monster' },
      { slug: 'multistrada', nameAr: 'Multistrada', nameEn: 'Multistrada' },
      { slug: 'scrambler', nameAr: 'Scrambler', nameEn: 'Scrambler' },
      { slug: 'diavel', nameAr: 'Diavel', nameEn: 'Diavel' },
      { slug: 'streetfighter', nameAr: 'Streetfighter', nameEn: 'Streetfighter' }
    ]
  },
  {
    slug: 'harley-davidson',
    nameAr: 'harley-davidson',
    nameEn: 'Harley-Davidson',
    icon: '🦅',
    models: [
      { slug: 'sportster', nameAr: 'Sportster', nameEn: 'Sportster' },
      { slug: 'street-glide', nameAr: 'Street Glide', nameEn: 'Street Glide' },
      { slug: 'fat-boy', nameAr: 'Fat Boy', nameEn: 'Fat Boy' },
      { slug: 'road-king', nameAr: 'Road King', nameEn: 'Road King' },
      { slug: 'softail', nameAr: 'Softail', nameEn: 'Softail' },
      { slug: 'pan-america', nameAr: 'Pan America', nameEn: 'Pan America' }
    ]
  },
  {
    slug: 'ktm',
    nameAr: 'KTM',
    nameEn: 'KTM',
    icon: '🟠',
    models: [
      { slug: 'duke-390', nameAr: 'Duke 390', nameEn: 'Duke 390' },
      { slug: 'duke-790', nameAr: 'Duke 790', nameEn: 'Duke 790' },
      { slug: 'duke-1290', nameAr: 'Duke 1290', nameEn: 'Duke 1290' },
      { slug: 'adventure-390', nameAr: 'Adventure 390', nameEn: 'Adventure 390' },
      { slug: 'adventure-1290', nameAr: 'Adventure 1290', nameEn: 'Adventure 1290' },
      { slug: 'rc-390', nameAr: 'RC 390', nameEn: 'RC 390' }
    ]
  },
  {
    slug: 'triumph',
    nameAr: 'triumph',
    nameEn: 'Triumph',
    icon: '🇬🇧',
    models: [
      { slug: 'bonneville', nameAr: 'Bonneville', nameEn: 'Bonneville' },
      { slug: 'tiger', nameAr: 'Tiger', nameEn: 'Tiger' },
      { slug: 'street-triple', nameAr: 'Street Triple', nameEn: 'Street Triple' },
      { slug: 'speed-triple', nameAr: 'Speed Triple', nameEn: 'Speed Triple' },
      { slug: 'rocket-3', nameAr: 'Rocket 3', nameEn: 'Rocket 3' },
      { slug: 'scrambler', nameAr: 'Scrambler', nameEn: 'Scrambler' }
    ]
  },
  {
    slug: 'aprilia',
    nameAr: 'aprilia',
    nameEn: 'Aprilia',
    icon: '🔴',
    models: [
      { slug: 'rs660', nameAr: 'RS660', nameEn: 'RS660' },
      { slug: 'tuono', nameAr: 'Tuono', nameEn: 'Tuono' },
      { slug: 'shiver', nameAr: 'Shiver', nameEn: 'Shiver' },
      { slug: 'rsv4', nameAr: 'RSV4', nameEn: 'RSV4' }
    ]
  },
  {
    slug: 'vespa',
    nameAr: 'vespa',
    nameEn: 'Vespa',
    icon: '🛵',
    models: [
      { slug: 'gts', nameAr: 'GTS', nameEn: 'GTS' },
      { slug: 'primavera', nameAr: 'Primavera', nameEn: 'Primavera' },
      { slug: 'sprint', nameAr: 'Sprint', nameEn: 'Sprint' },
      { slug: 'lx', nameAr: 'LX', nameEn: 'LX' }
    ]
  },
  {
    slug: 'piaggio',
    nameAr: 'piaggio',
    nameEn: 'Piaggio',
    icon: '🛵',
    models: [
      { slug: 'beverly', nameAr: 'Beverly', nameEn: 'Beverly' },
      { slug: 'liberty', nameAr: 'Liberty', nameEn: 'Liberty' },
      { slug: 'mp3', nameAr: 'MP3', nameEn: 'MP3' }
    ]
  },
  {
    slug: 'benelli',
    nameAr: 'benelli',
    nameEn: 'Benelli',
    icon: '🟢',
    models: [
      { slug: 'tnt-600', nameAr: 'TNT 600', nameEn: 'TNT 600' },
      { slug: 'trk-502', nameAr: 'TRK 502', nameEn: 'TRK 502' },
      { slug: 'leoncino', nameAr: 'Leoncino', nameEn: 'Leoncino' },
      { slug: '302s', nameAr: '302S', nameEn: '302S' }
    ]
  },
  {
    slug: 'cfmoto',
    nameAr: 'CFMoto',
    nameEn: 'CFMoto',
    icon: '🔵',
    models: [
      { slug: 'nk-400', nameAr: 'NK 400', nameEn: 'NK 400' },
      { slug: 'nk-650', nameAr: 'NK 650', nameEn: 'NK 650' },
      { slug: '650mt', nameAr: '650MT', nameEn: '650MT' },
      { slug: '800mt', nameAr: '800MT', nameEn: '800MT' }
    ]
  },
  {
    slug: 'royal-enfield',
    nameAr: 'royal-enfield',
    nameEn: 'Royal Enfield',
    icon: '🏍️',
    models: [
      { slug: 'classic-350', nameAr: 'Classic 350', nameEn: 'Classic 350' },
      { slug: 'himalayan', nameAr: 'Himalayan', nameEn: 'Himalayan' },
      { slug: 'interceptor', nameAr: 'Interceptor', nameEn: 'Interceptor' },
      { slug: 'meteor', nameAr: 'Meteor', nameEn: 'Meteor' }
    ]
  },
  {
    slug: 'other',
    nameAr: 'ماركات أخرى',
    nameEn: 'Other Brands',
    icon: '🏍️',
    models: [{ slug: 'other', nameAr: 'موديل آخر', nameEn: 'Other Model' }]
  }
];

/** @returns {CategoryDef[]} */
function getVehicleBrandCategories() {
  return [
    ...buildBrandTree('car', 'passenger-cars', carBrands, 100),
    ...buildBrandTree('moto', 'motorcycles', motorcycleBrands, 100)
  ];
}

module.exports = { getVehicleBrandCategories, carBrands, motorcycleBrands };
