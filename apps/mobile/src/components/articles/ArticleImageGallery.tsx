import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ListingImageModal } from '../ListingImageModal';
import { AppText } from '../AppText';
import { useI18n } from '../../i18n';
import { colors, radius, shadow } from '../../theme';

type ArticleImageGalleryProps = {
  images: string[];
};

export function ArticleImageGallery({ images }: ArticleImageGalleryProps) {
  const { isRtl, t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  if (images.length === 0) return null;

  const selectedImage = images[activeIndex] ?? images[0];

  return (
    <>
      <Pressable
        style={styles.hero}
        onPress={() => setGalleryOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t.articles.imageLabel}
      >
        <Image source={{ uri: selectedImage }} style={styles.heroImage} resizeMode="cover" />
        {images.length > 1 ? (
          <View style={[styles.imageCountBadge, isRtl && styles.imageCountBadgeRtl]}>
            <Ionicons name="images-outline" size={14} color="#fff" />
            <AppText style={styles.imageCountText}>
              {activeIndex + 1}/{images.length}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      {images.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.thumbs, isRtl && styles.thumbsRtl]}
        >
          {images.map((uri, index) => (
            <Pressable
              key={`${uri}-${index}`}
              onPress={() => setActiveIndex(index)}
              style={[styles.thumb, activeIndex === index && styles.thumbActive]}
            >
              <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ListingImageModal
        visible={galleryOpen}
        images={images}
        initialIndex={activeIndex}
        imageLabel={t.articles.imageLabel}
        onClose={() => setGalleryOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 280,
    backgroundColor: colors.brandSoft
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  imageCountBadgeRtl: {
    right: undefined,
    left: 14
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  thumbs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  thumbsRtl: {
    flexDirection: 'row-reverse'
  },
  thumb: {
    width: 72,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow
  },
  thumbActive: {
    borderColor: colors.brand
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.brandSoft
  }
});
