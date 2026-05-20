import { ApiError } from '../../shared/utils/api-error';
import { buildHeroSlideUpdateData, mapSlideForAdmin } from './hero-slide.mapper';
import { HeroRepository } from './hero.repository';
import type {
  CreateHeroBannerInput,
  CreateHeroSlideInput,
  ListAdminHeroSlidesQuery,
  ListHeroSlidesQuery,
  UpdateHeroBannerInput,
  UpdateHeroSlideInput
} from './hero.validation';

const heroRepository = new HeroRepository();

const mapSlideForLocale = (
  slide: Awaited<ReturnType<HeroRepository['listActive']>>[number],
  locale: 'ar' | 'en'
) => ({
  id: slide.id,
  sortOrder: slide.sortOrder,
  platform: slide.platform,
  imageUrl: slide.imageUrl,
  title: locale === 'en' ? slide.titleEn : slide.titleAr,
  subtitle: locale === 'en' ? slide.subtitleEn : slide.subtitleAr,
  buttonLabel: locale === 'en' ? slide.buttonLabelEn : slide.buttonLabelAr,
  buttonLink: slide.buttonLink
});

const mapBannerForLocale = (
  banner: Awaited<ReturnType<HeroRepository['listActiveBanners']>>[number],
  locale: 'ar' | 'en'
) => ({
  id: banner.id,
  sortOrder: banner.sortOrder,
  imageUrl: banner.imageUrl,
  text: locale === 'en' ? banner.textEn : banner.textAr,
  linkUrl: banner.linkUrl
});

export class HeroService {
  async listPublic(query: ListHeroSlidesQuery) {
    const locale = query.locale === 'en' ? 'en' : 'ar';
    const platform = query.platform === 'mobile' ? 'MOBILE' : 'WEB';
    const slides = await heroRepository.listActive(platform);
    return slides.map((slide) => mapSlideForLocale(slide, locale));
  }

  async listForAdmin(query: ListAdminHeroSlidesQuery = {}) {
    const slides = await heroRepository.listAll(query.platform);
    return slides.map(mapSlideForAdmin);
  }

  async getById(id: string) {
    const slide = await heroRepository.findById(id);
    if (!slide) throw new ApiError(404, 'Hero slide not found');
    return mapSlideForAdmin(slide);
  }

  async create(input: CreateHeroSlideInput) {
    const sortOrder = input.sortOrder ?? (await heroRepository.getNextSortOrder());
    const slide = await heroRepository.create({
      sortOrder,
      platform: input.platform,
      imageUrl: input.imageUrl,
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      subtitleAr: input.subtitleAr,
      subtitleEn: input.subtitleEn,
      buttonLabelAr: input.buttonLabelAr,
      buttonLabelEn: input.buttonLabelEn,
      buttonLink: input.buttonLink,
      isActive: input.isActive ?? true
    });
    return mapSlideForAdmin(slide);
  }

  async update(id: string, input: UpdateHeroSlideInput) {
    await this.getById(id);
    const slide = await heroRepository.update(id, buildHeroSlideUpdateData(input));
    return mapSlideForAdmin(slide);
  }

  async delete(id: string) {
    await this.getById(id);
    return heroRepository.delete(id);
  }

  async listBannersPublic(query: ListHeroSlidesQuery) {
    const locale = query.locale === 'en' ? 'en' : 'ar';
    const banners = await heroRepository.listActiveBanners();
    return banners.map((banner) => mapBannerForLocale(banner, locale));
  }

  async listBannersForAdmin() {
    return heroRepository.listAllBanners();
  }

  async getBannerById(id: string) {
    const banner = await heroRepository.findBannerById(id);
    if (!banner) throw new ApiError(404, 'Hero banner not found');
    return banner;
  }

  async createBanner(input: CreateHeroBannerInput) {
    const sortOrder = input.sortOrder ?? (await heroRepository.getNextBannerSortOrder());
    return heroRepository.createBanner({
      sortOrder,
      imageUrl: input.imageUrl,
      textAr: input.textAr?.trim() || null,
      textEn: input.textEn?.trim() || null,
      linkUrl: input.linkUrl,
      isActive: input.isActive ?? true
    });
  }

  async updateBanner(id: string, input: UpdateHeroBannerInput) {
    await this.getBannerById(id);
    return heroRepository.updateBanner(id, {
      ...input,
      textAr: input.textAr === undefined ? undefined : input.textAr?.trim() || null,
      textEn: input.textEn === undefined ? undefined : input.textEn?.trim() || null
    });
  }

  async deleteBanner(id: string) {
    await this.getBannerById(id);
    return heroRepository.deleteBanner(id);
  }
}

export const heroService = new HeroService();
