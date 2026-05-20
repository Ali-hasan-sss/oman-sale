import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { AppTextInput } from '../components/AppTextInput';
import { useI18n } from '../i18n';
import { useAuthStore, useListingsStore } from '../stores';
import { colors, radius } from '../theme';

const cities = ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'البريمي', 'الرستاق', 'السيب', 'الخوير', 'القرم'];

export function AddOfferScreen() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { locale, t, isRtl } = useI18n();
  const categories = useListingsStore((state) => state.categories);
  const isLoading = useListingsStore((state) => state.isLoadingCategories);
  const isSubmitting = useListingsStore((state) => state.isSubmittingListing);
  const loadCategories = useListingsStore((state) => state.loadCategories);
  const createListing = useListingsStore((state) => state.createListing);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState(cities[0]!);

  useEffect(() => {
    loadCategories(locale)
      .then(() => {
        const first = useListingsStore.getState().categories[0]?.id ?? '';
        setCategoryId(first);
      })
      .catch(() => undefined);
  }, [locale, loadCategories]);

  const selectedCategory = categories.find((item) => item.id === categoryId);

  const submit = async () => {
    if (!accessToken || !selectedCategory) return;

    const result = await createListing({
      title,
      description,
      type: selectedCategory.type,
      price: Number(price.replaceAll(',', '')),
      city,
      categoryId: selectedCategory.id,
      imageUrls: []
    });

    if (result.ok) {
      Alert.alert(t.addOffer.title, t.addOffer.success);
      setTitle('');
      setDescription('');
      setPrice('');
      return;
    }

    Alert.alert(t.common.loginRequired, t.auth.error);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText style={[styles.title, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.title}</AppText>
      <AppText style={[styles.subtitle, isRtl ? styles.rtl : styles.ltr]}>{t.addOffer.subtitle}</AppText>

      <Field label={t.addOffer.titleField} isRtl={isRtl}>
        <AppTextInput value={title} onChangeText={setTitle} style={[styles.input, isRtl ? styles.inputRtl : styles.inputLtr]} />
      </Field>
      <Field label={t.addOffer.category} isRtl={isRtl}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => {
            const active = category.id === categoryId;
            const label = (locale === 'ar' ? category.nameAr : category.nameEn) ?? category.name;
            return (
              <Pressable
                key={category.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryId(category.id)}
              >
                <AppText style={[styles.chipText, active && styles.chipTextActive, isRtl ? styles.chipLabelRtl : styles.chipLabelLtr]}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Field>
      <Field label={t.addOffer.city} isRtl={isRtl}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cities.map((item) => {
            const active = item === city;
            return (
              <Pressable key={item} style={[styles.chip, active && styles.chipActive]} onPress={() => setCity(item)}>
                <AppText style={[styles.chipText, active && styles.chipTextActive, isRtl ? styles.chipLabelRtl : styles.chipLabelLtr]}>{item}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Field>
      <Field label={t.addOffer.price} isRtl={isRtl}>
        <AppTextInput
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={[styles.input, isRtl ? styles.inputRtl : styles.inputLtr]}
        />
      </Field>
      <Field label={t.addOffer.description} isRtl={isRtl}>
        <AppTextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input, styles.textarea, isRtl ? styles.inputRtl : styles.inputLtr]}
        />
      </Field>

      <Pressable style={styles.submit} onPress={submit} disabled={isSubmitting}>
        <AppText style={styles.submitText}>{isSubmitting ? t.common.loading : t.addOffer.publish}</AppText>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children, isRtl }: { label: string; children: ReactNode; isRtl?: boolean }) {
  return (
    <View style={styles.field}>
      <AppText style={[styles.label, isRtl ? styles.rtl : styles.ltr]}>{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 120
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 16
  },
  field: {
    marginBottom: 14
  },
  label: {
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputRtl: {
    textAlign: 'right'
  },
  inputLtr: {
    textAlign: 'left'
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4
  },
  chipActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700'
  },
  chipTextActive: {
    color: colors.brandDark
  },
  chipLabelLtr: {
    textAlign: 'left'
  },
  chipLabelRtl: {
    textAlign: 'right'
  },
  submit: {
    marginTop: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center'
  },
  submitText: {
    color: '#fff',
    fontWeight: '900'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
