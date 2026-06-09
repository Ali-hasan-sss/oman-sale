import type { AssistantLocale } from './assistant.validation';

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(translate|translation|ترجم|ترجمة|ترجم لي|ترجم هذه)\b/i,
  /\b(homework|واجب|واجب مدرسي|حل سؤال)\b/i,
  /\b(python|javascript|typescript|react|sql query|اكواد|برمجة)\b/i,
  /\b(ما معنى كلمة|what does .+ mean|define the word)\b/i,
  /\b(قانون نيوتن|newton|photosynthesis|التركيب الضوئي|معادلة|equation)\b/i,
  /\b(who won the world cup|من فاز بكأس العالم)\b/i
];

const IN_SCOPE_HINTS: RegExp[] = [
  /\b(oman sale|عمان سيل|عروض|إعلان|متجر|اشتراك|تمييز|بنر|دردشة|مفضلة)\b/i,
  /\b(listing|store|promotion|banner|marketplace|subscription)\b/i,
  /\b(سياحة|معلم|معالم|سياحي|سفر|زيارة|عمان|oman|muscat|مسقط|salalah|صلالة|nizwa|نزوى|wadi|وادي)\b/i,
  /\b(tourism|landmark|travel|visit|destination)\b/i
];

export function buildOffTopicRefusal(locale: AssistantLocale): string {
  return locale === 'ar'
    ? 'أنا مساعد Oman Sale فقط 🏪\n\nأساعدك في العروض والمتاجر وخطط المنصة والمعالم السياحية في عُمان.\n\nلا أستطيع المساعدة في الترجمة أو الواجبات أو الأسئلة العلمية أو أي موضوع خارج نطاق الموقع والسياحة في عُمان.'
    : "I'm the Oman Sale assistant only 🏪\n\nI help with listings, stores, platform plans, and tourism in Oman.\n\nI can't help with translations, homework, science questions, or topics outside the site and Omani tourism.";
}

export function isClearlyOffTopic(message: string): boolean {
  const text = message.trim();
  if (text.length < 4) return false;

  if (IN_SCOPE_HINTS.some((pattern) => pattern.test(text))) {
    return false;
  }

  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}
