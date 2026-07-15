type PlanPoint = {
  points: number;
  plan: {
    nameAr: string;
    nameEn: string;
  };
};

type RaffleHeroSource = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  startsAt: Date;
  endsAt: Date;
  planPoints: PlanPoint[];
};

function getDurationDays(startsAt: Date, endsAt: Date) {
  return Math.max(1, Math.ceil((endsAt.getTime() - startsAt.getTime()) / (24 * 60 * 60 * 1000)));
}

function formatDate(date: Date, locale: 'ar' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', {
    dateStyle: 'long'
  }).format(date);
}

function getMaxPoints(planPoints: PlanPoint[]) {
  return planPoints.reduce((max, item) => Math.max(max, item.points), 0);
}

function buildPointsHint(planPoints: PlanPoint[], locale: 'ar' | 'en') {
  const activePlans = planPoints.filter((item) => item.points > 0);
  if (activePlans.length === 0) {
    return locale === 'ar' ? 'اكسب نقاطاً عند تمييز إعلانك.' : 'Earn points when you promote your listing.';
  }

  const labels = activePlans
    .slice(0, 3)
    .map((item) =>
      locale === 'ar'
        ? `${item.plan.nameAr} (${item.points} نقطة)`
        : `${item.plan.nameEn} (${item.points} pts)`
    )
    .join(locale === 'ar' ? '، ' : ', ');

  return locale === 'ar' ? `النقاط: ${labels}.` : `Points: ${labels}.`;
}

export function buildRaffleHeroSuggestion(raffle: RaffleHeroSource) {
  const durationDays = getDurationDays(raffle.startsAt, raffle.endsAt);
  const maxPoints = getMaxPoints(raffle.planPoints);
  const endDateAr = formatDate(raffle.endsAt, 'ar');
  const endDateEn = formatDate(raffle.endsAt, 'en');
  const pointsHintAr = buildPointsHint(raffle.planPoints, 'ar');
  const pointsHintEn = buildPointsHint(raffle.planPoints, 'en');

  const titleAr = raffle.titleAr.trim() || 'سحب Oman Sale';
  const titleEn = raffle.titleEn.trim() || 'Oman Sale Raffle';

  const subtitleAr =
    raffle.descriptionAr.trim() ||
    `سجّل تلقائياً في السحب عند تمييز إعلانك! العرض مستمر ${durationDays} يوماً حتى ${endDateAr}. ${pointsHintAr}${
      maxPoints > 0 ? ` اكسب حتى ${maxPoints} نقطة لكل تمييز.` : ''
    }`;

  const subtitleEn =
    raffle.descriptionEn.trim() ||
    `Join automatically when you promote your listing! The raffle runs for ${durationDays} days until ${endDateEn}. ${pointsHintEn}${
      maxPoints > 0 ? ` Earn up to ${maxPoints} points per promotion.` : ''
    }`;

  return {
    titleAr,
    titleEn,
    subtitleAr,
    subtitleEn,
    buttonLabelAr: 'شارك في السحب',
    buttonLabelEn: 'Join the raffle',
    buttonLink: '/raffle',
    platform: 'ALL' as const,
    durationDays,
    maxPoints
  };
}
