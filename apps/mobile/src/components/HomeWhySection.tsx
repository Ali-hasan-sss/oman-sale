import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { colors, shadow } from '../theme';

const icons = ['call-outline', 'location-outline', 'flash-outline', 'shield-checkmark-outline'] as const;

type HomeWhySectionProps = {
  onBrowseNews: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenRefund: () => void;
};

export function HomeWhySection({ onBrowseNews, onOpenTerms, onOpenPrivacy, onOpenRefund }: HomeWhySectionProps) {
  const { t } = useI18n();

  return (
    <View>
      <View style={styles.section}>
        <AppText style={styles.title}>{t.home.whyTitle}</AppText>
        <AppText style={styles.subtitle}>{t.home.whySubtitle}</AppText>
        {t.home.features.map((feature, index) => (
          <View key={feature[0]} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={icons[index] ?? 'shield-checkmark-outline'} size={32} color="#168c4e" />
            </View>
            <AppText style={styles.cardTitle}>{feature[0]}</AppText>
            <AppText style={styles.cardText}>{feature[1]}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <AppText style={styles.footerTitle}>Oman Sale</AppText>
        <AppText style={styles.footerText}>{t.home.footerDescription}</AppText>
        <AppText style={styles.footerText}>{t.home.footerLocation}</AppText>
        <View style={styles.links}>
          <Pressable onPress={onBrowseNews}>
            <AppText style={styles.link}>{t.common.news}</AppText>
          </Pressable>
          <Pressable onPress={onOpenPrivacy}>
            <AppText style={styles.link}>{t.common.privacy}</AppText>
          </Pressable>
          <Pressable onPress={onOpenTerms}>
            <AppText style={styles.link}>{t.common.terms}</AppText>
          </Pressable>
          <Pressable onPress={onOpenRefund}>
            <AppText style={styles.link}>{t.common.refund}</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  subtitle: {
    textAlign: 'center',
    color: '#475569',
    marginTop: 6,
    marginBottom: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    marginBottom: 12,
    alignItems: 'center',
    ...shadow
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#d9f5e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'center'
  },
  cardText: {
    color: '#475569',
    lineHeight: 22,
    textAlign: 'center'
  },
  footer: {
    marginTop: 12,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24
  },
  footerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8
  },
  footerText: {
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 8
  },
  links: {
    marginTop: 8,
    gap: 10
  },
  link: {
    color: '#e2e8f0',
    fontWeight: '700'
  }
});
