import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { LegalHtmlView } from '../components/LegalHtmlView';
import { useScreenInsets } from '../hooks/use-screen-insets';
import { useI18n } from '../i18n';
import { fetchLegalDocument, type LegalKind } from '../services/legal.service';
import { colors } from '../theme';

const CONTACT_EMAIL = 'info@omansale.om';

type LegalScreenProps = {
  kind: LegalKind;
};

export function LegalScreen({ kind }: LegalScreenProps) {
  const { locale, t, isRtl } = useI18n();
  const text = t.legal;
  const { scrollBottomPadding } = useScreenInsets();
  const textAlign = isRtl ? styles.rtl : styles.ltr;
  const [loading, setLoading] = useState(true);
  const titleByKind = {
    terms: text.termsTitle,
    privacy: text.privacyTitle,
    refund: text.refundTitle
  } as const;
  const [title, setTitle] = useState<string>(titleByKind[kind]);
  const [body, setBody] = useState('');
  const [contactTitle, setContactTitle] = useState<string>(text.contactTitle);
  const [contactText, setContactText] = useState<string>(text.contactText);
  const [lastUpdated, setLastUpdated] = useState('');
  const [useRemote, setUseRemote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLegalDocument(kind, locale)
      .then((document) => {
        if (cancelled) return;
        setTitle(document.title);
        setBody(document.body);
        setContactTitle(document.contactTitle || text.contactTitle);
        setContactText(document.contactText || text.contactText);
        setLastUpdated(
          document.lastUpdated
            ? new Date(document.lastUpdated).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ar-OM', {
                month: 'long',
                year: 'numeric'
              })
            : ''
        );
        setUseRemote(Boolean(document.body?.trim()));
      })
      .catch(() => {
        if (cancelled) return;
        setTitle(titleByKind[kind]);
        setBody('');
        setContactTitle(text.contactTitle);
        setContactText(text.contactText);
        setLastUpdated('');
        setUseRemote(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, locale, text.contactText, text.contactTitle, text.privacyTitle, text.refundTitle, text.termsTitle]);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <AppText style={[styles.title, textAlign]}>{title}</AppText>
      {lastUpdated ? <AppText style={[styles.meta, textAlign]}>{lastUpdated}</AppText> : null}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : useRemote ? (
        <LegalHtmlView html={body} isRtl={isRtl} />
      ) : (
        <AppText style={[styles.empty, textAlign]}>{text.notPublished}</AppText>
      )}

      <View style={styles.contact}>
        <AppText style={[styles.sectionTitle, textAlign]}>{contactTitle}</AppText>
        <AppText style={[styles.paragraph, textAlign]}>
          {contactText}{' '}
          <AppText style={styles.link} onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
            {CONTACT_EMAIL}
          </AppText>
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    flexGrow: 1
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink
  },
  meta: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13
  },
  loader: {
    marginTop: 24
  },
  empty: {
    marginTop: 18,
    color: colors.muted,
    lineHeight: 24,
    fontSize: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink
  },
  paragraph: {
    color: colors.ink,
    lineHeight: 24,
    fontSize: 15
  },
  contact: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 8
  },
  link: {
    color: colors.brand,
    fontWeight: '700'
  },
  rtl: {
    textAlign: 'right'
  },
  ltr: {
    textAlign: 'left'
  }
});
