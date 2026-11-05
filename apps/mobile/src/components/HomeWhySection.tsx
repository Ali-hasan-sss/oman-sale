import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { useI18n } from '../i18n';
import { rowDirection } from '../lib/layout-direction';
import { colors, shadow } from '../theme';

const CONTACT_EMAIL = 'info@omansale.om';
const LICENSE_NUMBER = 'L3787876';
const footerLogo = require('../../assets/nav-logo.png');

const icons = ['call-outline', 'location-outline', 'flash-outline', 'shield-checkmark-outline'] as const;

type HomeWhySectionProps = {
  bottomInset?: number;
  onBrowseNews: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenRefund: () => void;
};

export function HomeWhySection({
  bottomInset = 0,
  onBrowseNews,
  onOpenTerms,
  onOpenPrivacy,
  onOpenRefund
}: HomeWhySectionProps) {
  const { t, isRtl } = useI18n();
  const contactAlign = isRtl ? styles.contactRtl : styles.contactLtr;

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

      <View style={[styles.footer, { paddingBottom: 28 + bottomInset }]}>
        <Image source={footerLogo} style={[styles.logo, isRtl ? styles.logoRtl : styles.logoLtr]} resizeMode="contain" />
        <AppText style={styles.footerText}>{t.home.footerDescription}</AppText>
        <View style={[styles.contacts, contactAlign]}>
          <Pressable style={[styles.contactRow, rowDirection(isRtl)]} onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
            <Ionicons name="mail-outline" size={18} color="#22c55e" />
            <AppText style={[styles.contactValue, styles.email]}>{CONTACT_EMAIL}</AppText>
          </Pressable>
          <View style={[styles.contactRow, rowDirection(isRtl)]}>
            <Ionicons name="location-outline" size={18} color="#22c55e" />
            <AppText style={styles.contactValue}>{t.home.footerLocation}</AppText>
          </View>
          <View style={[styles.contactRow, rowDirection(isRtl)]}>
            <Ionicons name="document-text-outline" size={18} color="#22c55e" />
            <AppText style={styles.contactValue}>
              {t.home.footerLicense}: {LICENSE_NUMBER}
            </AppText>
          </View>
        </View>
        <View style={[styles.links, rowDirection(isRtl)]}>
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
    backgroundColor: '#070d1a',
    paddingHorizontal: 22,
    paddingTop: 28
  },
  logo: {
    width: 148,
    height: 92,
    marginBottom: 18
  },
  logoRtl: {
    alignSelf: 'flex-end'
  },
  logoLtr: {
    alignSelf: 'flex-start'
  },
  footerText: {
    color: '#cbd5e1',
    lineHeight: 26,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 22
  },
  contacts: {
    width: '100%',
    gap: 14,
    marginBottom: 8
  },
  contactRtl: {
    alignItems: 'flex-end'
  },
  contactLtr: {
    alignItems: 'flex-start'
  },
  contactRow: {
    alignItems: 'center',
    gap: 10
  },
  contactValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700'
  },
  email: {
    writingDirection: 'ltr'
  },
  links: {
    marginTop: 18,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14
  },
  link: {
    color: '#e2e8f0',
    fontWeight: '700'
  }
});
