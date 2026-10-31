import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { useI18n } from '../i18n';
import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';
import { resolveApiErrorMessage } from '../lib/api-errors';
import type { BannerAdTarget } from '../lib/banner-ad-nav';
import { uploadAdMedia } from '../services/media.service';
import { colors, radius } from '../theme';

type BannerPricing = {
  pricePerDay: number;
  minDays: number;
  maxDays: number;
  isActive?: boolean;
};

type CheckoutPayload = {
  request?: { id: string };
  checkout: { paid?: boolean; paymentUrl?: string; sessionId?: string };
};

type BannerAdRequestScreenProps = BannerAdTarget & {
  onDone: () => void;
};

function formatOmr(value: number) {
  return new Intl.NumberFormat('en-OM', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(value);
}

function paymentReturnKind(url: string) {
  if (url.includes('/banner-ad/success')) return 'success' as const;
  if (url.includes('/banner-ad/cancel')) return 'cancel' as const;
  return null;
}

function sessionIdFromUrl(url: string) {
  const match = url.match(/[?&]session_id=([^&#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

export function BannerAdRequestScreen({
  placement = 'HOME_BELOW_HERO',
  linkUrl: initialLink = '',
  imageUrl: initialImage = '',
  textAr: initialTextAr = '',
  textEn: initialTextEn = '',
  onDone
}: BannerAdRequestScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const isAr = locale === 'ar';
  const textAlign = isRtl ? 'right' : 'left';
  const [pricing, setPricing] = useState<BannerPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageRef, setImageRef] = useState(initialImage ?? '');
  const [previewUrl, setPreviewUrl] = useState(initialImage ?? '');
  const [linkUrl, setLinkUrl] = useState(initialLink);
  const [textAr, setTextAr] = useState(initialTextAr);
  const [textEn, setTextEn] = useState(initialTextEn);
  const [durationDays, setDurationDays] = useState(7);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [phase, setPhase] = useState<'form' | 'pay' | 'success' | 'cancelled' | 'failed'>('form');
  const handledReturn = useRef(false);
  const webRef = useRef<WebView>(null);

  const copy = isAr
    ? {
        title: 'طلب بنر إعلاني',
        subtitle: 'ارفع صورة الإعلان، ثم أكمل الدفع عبر ثواني داخل التطبيق.',
        image: 'صورة الإعلان',
        pick: 'اختيار صورة',
        change: 'تغيير الصورة',
        link: 'رابط الإعلان عند النقر',
        textAr: 'نص الإعلان بالعربية',
        textEn: 'نص الإعلان بالإنجليزية',
        days: 'عدد الأيام',
        perDay: 'السعر لليوم',
        total: 'الإجمالي',
        submit: 'متابعة الدفع',
        uploading: 'جاري رفع الصورة...',
        loading: 'جاري تحميل السعر...',
        unavailable: 'الإعلان في هذا البنر غير متاح حالياً.',
        imageRequired: 'اختر صورة الإعلان أولاً.',
        linkRequired: 'أدخل رابط الإعلان.',
        payTitle: 'الدفع عبر ثواني',
        success: 'تم استلام الدفع. سيُراجع الإعلان ثم يُنشر.',
        cancelled: 'تم إلغاء الدفع. يمكنك المحاولة مرة أخرى.',
        failed: 'تعذر تأكيد الدفع. إذا اكتمل الدفع ستصلك النتيجة بعد قليل.',
        done: 'تم',
        retry: 'العودة للنموذج'
      }
    : {
        title: 'Banner ad request',
        subtitle: 'Upload the ad image, then pay with Thawani inside the app.',
        image: 'Ad image',
        pick: 'Choose image',
        change: 'Change image',
        link: 'Click-through link',
        textAr: 'Ad text in Arabic',
        textEn: 'Ad text in English',
        days: 'Number of days',
        perDay: 'Price per day',
        total: 'Total',
        submit: 'Continue to payment',
        uploading: 'Uploading image...',
        loading: 'Loading price...',
        unavailable: 'Advertising in this banner is currently unavailable.',
        imageRequired: 'Choose an ad image first.',
        linkRequired: 'Enter the ad link.',
        payTitle: 'Thawani payment',
        success: 'Payment received. The ad will be reviewed, then published.',
        cancelled: 'Payment was cancelled. You can try again.',
        failed: 'Could not confirm the payment. If it completed, the result will follow shortly.',
        done: 'Done',
        retry: 'Back to the form'
      };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    http
      .get<ApiEnvelope<BannerPricing>>(API_ENDPOINTS.bannerRequests.pricing, { params: { placement } })
      .then((response) => {
        if (cancelled) return;
        setPricing(response.data.data);
        setDurationDays(response.data.data.minDays || 1);
        if (response.data.data.isActive === false) {
          setError(isAr ? 'الإعلان في هذا البنر غير متاح حالياً.' : 'Advertising in this banner is currently unavailable.');
        }
      })
      .catch(() => {
        if (!cancelled) setError(isAr ? 'تعذر تحميل السعر.' : 'Could not load the price.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAr, placement]);

  const total = useMemo(() => {
    if (!pricing) return 0;
    return Number((pricing.pricePerDay * durationDays).toFixed(3));
  }, [durationDays, pricing]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(isAr ? 'يلزم السماح بالوصول إلى الصور.' : 'Photo access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadAdMedia({
        uri: asset.uri,
        name: asset.fileName || 'banner.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        kind: 'image',
        folder: 'banners'
      });
      setImageRef(uploaded.key);
      setPreviewUrl(uploaded.url || asset.uri);
    } catch (uploadError) {
      setError(resolveApiErrorMessage(uploadError, t.errors, isAr ? 'تعذر رفع الصورة.' : 'Could not upload the image.'));
    } finally {
      setUploading(false);
    }
  };

  const finishReturn = async (kind: 'success' | 'cancel', url: string) => {
    const resolvedSession = sessionIdFromUrl(url) || sessionId;
    try {
      if (kind === 'success') {
        if (!resolvedSession) throw new Error('missing session');
        await http.post(API_ENDPOINTS.bannerRequests.confirmPayment, { sessionId: resolvedSession });
        setPhase('success');
        return;
      }
      if (resolvedSession) {
        await http.post(API_ENDPOINTS.bannerRequests.cancelPayment, { sessionId: resolvedSession }).catch(() => undefined);
      }
      setPhase('cancelled');
    } catch (confirmError) {
      setError(resolveApiErrorMessage(confirmError, t.errors, copy.failed));
      setPhase('failed');
    }
  };

  const interceptNavigation = (url: string) => {
    const kind = paymentReturnKind(url);
    if (!kind || handledReturn.current) return false;
    handledReturn.current = true;
    webRef.current?.stopLoading();
    void finishReturn(kind, url);
    return true;
  };

  const submit = async () => {
    setError('');
    if (pricing?.isActive === false) {
      setError(copy.unavailable);
      return;
    }
    if (!imageRef.trim()) {
      setError(copy.imageRequired);
      return;
    }
    if (!linkUrl.trim()) {
      setError(copy.linkRequired);
      return;
    }
    setSubmitting(true);
    try {
      const response = await http.post<ApiEnvelope<CheckoutPayload>>(
        API_ENDPOINTS.bannerRequests.create,
        {
          placement,
          imageUrl: imageRef.trim(),
          linkUrl: linkUrl.trim(),
          textAr: textAr.trim() || undefined,
          textEn: textEn.trim() || undefined,
          durationDays
        },
        { params: { locale } }
      );
      const checkout = response.data.data.checkout;
      if (checkout.paid || !checkout.paymentUrl) {
        setPhase('success');
        return;
      }
      handledReturn.current = false;
      setSessionId(checkout.sessionId || '');
      setPaymentUrl(checkout.paymentUrl);
      setPhase('pay');
    } catch (submitError) {
      setError(resolveApiErrorMessage(submitError, t.errors, isAr ? 'تعذر إرسال الطلب.' : 'Could not submit the request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const changeDays = (delta: number) => {
    setDurationDays((current) => {
      const min = pricing?.minDays ?? 1;
      const max = pricing?.maxDays ?? 90;
      return Math.min(max, Math.max(min, current + delta));
    });
  };

  if (phase === 'pay' && paymentUrl) {
    return (
      <View style={styles.payScreen}>
        <AppText style={styles.payTitle}>{copy.payTitle}</AppText>
        <WebView
          ref={webRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(request) => !interceptNavigation(request.url)}
          onNavigationStateChange={(state: WebViewNavigation) => {
            interceptNavigation(state.url);
          }}
        />
      </View>
    );
  }

  if (phase === 'success' || phase === 'cancelled' || phase === 'failed') {
    const message = phase === 'success' ? copy.success : phase === 'cancelled' ? copy.cancelled : error || copy.failed;
    return (
      <View style={styles.result}>
        <AppText style={[styles.title, { textAlign }]}>{copy.title}</AppText>
        <AppText style={[styles.resultText, { textAlign }]}>{message}</AppText>
        {error && phase !== 'failed' ? <AppText style={styles.error}>{error}</AppText> : null}
        <Pressable style={styles.primary} onPress={phase === 'cancelled' ? () => setPhase('form') : onDone}>
          <AppText style={styles.primaryText}>{phase === 'cancelled' ? copy.retry : copy.done}</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppText style={[styles.title, { textAlign }]}>{copy.title}</AppText>
      <AppText style={[styles.subtitle, { textAlign }]}>{copy.subtitle}</AppText>
      {loading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : null}
      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      <AppText style={[styles.label, { textAlign }]}>{copy.image}</AppText>
      {previewUrl ? <Image source={{ uri: previewUrl }} style={styles.preview} resizeMode="cover" /> : null}
      <Pressable style={styles.secondary} onPress={() => void pickImage()} disabled={uploading}>
        <AppText style={styles.secondaryText}>{uploading ? copy.uploading : previewUrl ? copy.change : copy.pick}</AppText>
      </Pressable>

      <AppText style={[styles.label, { textAlign }]}>{copy.link}</AppText>
      <AppTextInput value={linkUrl} onChangeText={setLinkUrl} autoCapitalize="none" style={styles.input} />

      <AppText style={[styles.label, { textAlign }]}>{copy.textAr}</AppText>
      <AppTextInput value={textAr} onChangeText={setTextAr} style={styles.input} />

      <AppText style={[styles.label, { textAlign }]}>{copy.textEn}</AppText>
      <AppTextInput value={textEn} onChangeText={setTextEn} style={styles.input} />

      <AppText style={[styles.label, { textAlign }]}>{copy.days}</AppText>
      <View style={styles.daysRow}>
        <Pressable style={styles.step} onPress={() => changeDays(-1)}>
          <AppText style={styles.stepText}>-</AppText>
        </Pressable>
        <AppText style={styles.daysValue}>{durationDays}</AppText>
        <Pressable style={styles.step} onPress={() => changeDays(1)}>
          <AppText style={styles.stepText}>+</AppText>
        </Pressable>
      </View>

      <View style={styles.priceRow}>
        <AppText style={styles.priceLabel}>{copy.perDay}</AppText>
        <AppText style={styles.priceValue}>{pricing ? `${formatOmr(pricing.pricePerDay)} ${isAr ? 'ر.ع' : 'OMR'}` : '—'}</AppText>
      </View>
      <View style={styles.priceRow}>
        <AppText style={styles.priceLabel}>{copy.total}</AppText>
        <AppText style={styles.priceValue}>{pricing ? `${formatOmr(total)} ${isAr ? 'ر.ع' : 'OMR'}` : '—'}</AppText>
      </View>

      <Pressable style={[styles.primary, (submitting || loading || uploading) && styles.disabled]} disabled={submitting || loading || uploading} onPress={() => void submit()}>
        <AppText style={styles.primaryText}>{submitting ? (isAr ? 'جاري المعالجة...' : 'Processing...') : copy.submit}</AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: colors.muted,
    lineHeight: 22
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '800',
    color: colors.ink
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  preview: {
    width: '100%',
    height: 140,
    borderRadius: radius.md,
    backgroundColor: '#e2e8f0',
    marginBottom: 8
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.brandDark
  },
  daysValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    minWidth: 32,
    textAlign: 'center'
  },
  priceRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  priceLabel: {
    color: colors.muted,
    fontWeight: '700'
  },
  priceValue: {
    color: colors.ink,
    fontWeight: '900'
  },
  primary: {
    marginTop: 20,
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryText: {
    color: '#fff',
    fontWeight: '900'
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryText: {
    color: colors.brandDark,
    fontWeight: '800'
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
    marginBottom: 8
  },
  loader: {
    marginVertical: 12
  },
  disabled: {
    opacity: 0.6
  },
  payScreen: {
    flex: 1
  },
  payTitle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '900',
    color: colors.ink
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff'
  },
  result: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  resultText: {
    marginTop: 12,
    color: colors.ink,
    lineHeight: 24,
    fontSize: 16
  }
});
