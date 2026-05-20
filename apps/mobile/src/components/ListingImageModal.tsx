import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { colors } from '../theme';

type ListingImageModalProps = {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  imageLabel: string;
  onClose: () => void;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function ListingImageModal({
  visible,
  images,
  initialIndex = 0,
  title,
  imageLabel,
  onClose
}: ListingImageModalProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setActiveIndex(initialIndex);
    requestAnimationFrame(() => {
      if (images.length > 0 && initialIndex > 0) {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }
    });
  }, [visible, initialIndex, images.length]);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button">
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
          <View style={styles.topMeta}>
            {title ? (
              <AppText style={styles.title} numberOfLines={1}>
                {title}
              </AppText>
            ) : null}
            <AppText style={styles.counter}>
              {imageLabel} {activeIndex + 1} / {images.length}
            </AppText>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={images.length > 0 ? Math.min(initialIndex, images.length - 1) : 0}
          getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
            </View>
          )}
          onScrollToIndexFailed={() => undefined}
        />

        {images.length > 1 ? (
          <View style={[styles.dots, { paddingBottom: insets.bottom + 16 }]}>
            {images.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000'
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  topMeta: {
    flex: 1
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  },
  counter: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2
  },
  slide: {
    width: screenWidth,
    height: screenHeight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.82
  },
  dots: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)'
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.brand
  }
});
