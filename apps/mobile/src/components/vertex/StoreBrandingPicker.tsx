import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { useI18n } from '../../i18n';

type StoreBrandingPickerProps = {
  logoUrl: string;
  coverUrl: string;
  onLogoChange: (value: string) => void;
  onCoverChange: (value: string) => void;
};

/**
 * Cover + logo picker laid out like the store card (wide cover, square logo overlapping
 * its corner). Images are sent as data URLs, the same way "My store" saves them.
 */
export function StoreBrandingPicker({ logoUrl, coverUrl, onLogoChange, onCoverChange }: StoreBrandingPickerProps) {
  const { locale, isRtl } = useI18n();
  const [busy, setBusy] = useState<'logo' | 'cover' | null>(null);
  const t =
    locale === 'en'
      ? {
          title: 'Store photo & cover',
          hint: 'Square logo and a wide cover. You can change both later from My store.',
          addCover: 'Add a cover image',
          changeCover: 'Change cover',
          logo: 'Store photo'
        }
      : {
          title: 'صورة المتجر والغلاف',
          hint: 'شعار مربع وغلاف عريض. يمكنك تغييرهما لاحقًا من صفحة متجري.',
          addCover: 'أضف صورة الغلاف',
          changeCover: 'تغيير الغلاف',
          logo: 'صورة المتجر'
        };

  const pick = async (target: 'logo' | 'cover') => {
    setBusy(target);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: target === 'logo' ? [1, 1] : [3, 1],
        quality: 0.7,
        base64: true
      });
      if (result.canceled || !result.assets[0]?.base64) return;
      const mime = result.assets[0].mimeType ?? 'image/jpeg';
      const dataUrl = `data:${mime};base64,${result.assets[0].base64}`;
      if (target === 'logo') onLogoChange(dataUrl);
      else onCoverChange(dataUrl);
    } finally {
      setBusy(null);
    }
  };

  const align = { textAlign: isRtl ? ('right' as const) : ('left' as const) };

  return (
    <View style={styles.wrap}>
      <AppText style={[styles.title, align]}>{t.title}</AppText>
      <AppText style={[styles.hint, align]}>{t.hint}</AppText>

      <View style={styles.stage}>
        <Pressable onPress={() => void pick('cover')} disabled={busy !== null} style={styles.cover}>
          <LinearGradient colors={['#f0fdf4', '#ffffff', '#f1f5f9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {coverUrl ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          <View style={[styles.coverPill, coverUrl ? styles.coverPillOnImage : null]}>
            {busy === 'cover' ? <ActivityIndicator size="small" color="#11703e" /> : <Ionicons name="image-outline" size={16} color="#11703e" />}
            <AppText style={styles.coverPillText}>{coverUrl ? t.changeCover : t.addCover}</AppText>
          </View>
          {coverUrl ? (
            <Pressable onPress={() => onCoverChange('')} hitSlop={8} style={[styles.remove, isRtl ? { left: 10 } : { right: 10 }]}>
              <Ionicons name="close" size={16} color="#334155" />
            </Pressable>
          ) : null}
        </Pressable>

        <View style={[styles.logoWrap, isRtl ? { right: 18 } : { left: 18 }]}>
          <Pressable onPress={() => void pick('logo')} disabled={busy !== null} style={styles.logo}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Ionicons name="camera-outline" size={28} color="#ffffff" style={{ marginTop: -14 }} />
            )}
            <View style={styles.logoLabel}>
              {busy === 'logo' ? <ActivityIndicator size="small" color="#fff" /> : null}
              <AppText style={styles.logoLabelText}>{t.logo}</AppText>
            </View>
          </Pressable>
          {logoUrl ? (
            <Pressable onPress={() => onLogoChange('')} hitSlop={8} style={[styles.logoRemove, isRtl ? { left: -8 } : { right: -8 }]}>
              <Ionicons name="close" size={14} color="#334155" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  hint: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 12,
    color: '#64748b'
  },
  stage: {
    paddingBottom: 44
  },
  cover: {
    height: 140,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  coverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#bbe8cc'
  },
  coverPillOnImage: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'transparent'
  },
  coverPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#11703e'
  },
  remove: {
    position: 'absolute',
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoWrap: {
    position: 'absolute',
    bottom: 0
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#11703e',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5
  },
  logoLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  logoLabelText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center'
  },
  logoRemove: {
    position: 'absolute',
    top: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
