import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { uploadAdMedia } from '../services/media.service';
import { insetEnd, rowDirection } from '../lib/layout-direction';
import { colors, radius } from '../theme';

const MAX_IMAGES = 8;

type ListingAdMediaPickerProps = {
  imageUrls: string[];
  videoUrl: string | null;
  onImageUrlsChange: (urls: string[]) => void;
  onVideoUrlChange: (url: string | null) => void;
  labels: {
    images: string;
    uploadTitle: string;
    uploadHint: string;
    video: string;
    videoTitle: string;
    videoHint: string;
    uploading: string;
    removeImage: string;
    uploadError: string;
  };
  isRtl: boolean;
  disabled?: boolean;
};

function guessMimeType(uri: string, kind: 'image' | 'video') {
  const lower = uri.toLowerCase();
  if (kind === 'video') {
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  }
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export function ListingAdMediaPicker({
  imageUrls,
  videoUrl,
  onImageUrlsChange,
  onVideoUrlChange,
  labels,
  isRtl,
  disabled
}: ListingAdMediaPickerProps) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const textAlign = isRtl ? styles.rtl : styles.ltr;

  const pickImages = async () => {
    if (disabled || uploadingImages || imageUrls.length >= MAX_IMAGES) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - imageUrls.length
    });
    if (result.canceled) return;

    setError('');
    setUploadingImages(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets.slice(0, MAX_IMAGES - imageUrls.length)) {
        const mimeType = asset.mimeType || guessMimeType(asset.uri, 'image');
        const name = asset.fileName || `listing-${Date.now()}.jpg`;
        const media = await uploadAdMedia({
          uri: asset.uri,
          name,
          mimeType,
          size: asset.fileSize,
          kind: 'image'
        });
        uploaded.push(media.key);
        setPreviews((current) => ({ ...current, [media.key]: media.url || asset.uri }));
      }
      onImageUrlsChange([...imageUrls, ...uploaded]);
    } catch {
      setError(labels.uploadError);
    } finally {
      setUploadingImages(false);
    }
  };

  const pickVideo = async () => {
    if (disabled || uploadingVideo) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setError('');
    setUploadingVideo(true);
    try {
      const media = await uploadAdMedia({
        uri: asset.uri,
        name: asset.fileName || `listing-video-${Date.now()}.mp4`,
        mimeType: asset.mimeType || guessMimeType(asset.uri, 'video'),
        size: asset.fileSize,
        kind: 'video'
      });
      onVideoUrlChange(media.key);
    } catch {
      setError(labels.uploadError);
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText style={[styles.sectionTitle, textAlign]}>{labels.images}</AppText>
      <View style={[styles.imageGrid, rowDirection(isRtl)]}>
        {imageUrls.map((url) => (
          <View key={url} style={styles.thumb}>
            <Image source={{ uri: previews[url] || url }} style={styles.thumbImage} />
            <Pressable
              style={[styles.remove, insetEnd(isRtl, 6)]}
              onPress={() => onImageUrlsChange(imageUrls.filter((item) => item !== url))}
              disabled={disabled}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {imageUrls.length < MAX_IMAGES ? (
          <Pressable style={styles.addTile} onPress={() => void pickImages()} disabled={disabled || uploadingImages}>
            {uploadingImages ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <>
                <Ionicons name="image-outline" size={28} color={colors.muted} />
                <AppText style={styles.addText}>{labels.uploadTitle}</AppText>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
      <AppText style={[styles.hint, textAlign]}>{labels.uploadHint}</AppText>

      <AppText style={[styles.sectionTitle, styles.videoTitle, textAlign]}>{labels.video}</AppText>
      {videoUrl ? (
        <View style={[styles.videoRow, rowDirection(isRtl)]}>
          <Ionicons name="videocam" size={20} color={colors.brand} />
          <AppText style={styles.videoReady}>{labels.videoTitle}</AppText>
          <Pressable onPress={() => onVideoUrlChange(null)} disabled={disabled}>
            <AppText style={styles.removeText}>{labels.removeImage}</AppText>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.addTileWide} onPress={() => void pickVideo()} disabled={disabled || uploadingVideo}>
          {uploadingVideo ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <>
              <Ionicons name="videocam-outline" size={28} color={colors.muted} />
              <AppText style={styles.addText}>{labels.videoTitle}</AppText>
              <AppText style={styles.hint}>{labels.videoHint}</AppText>
            </>
          )}
        </Pressable>
      )}
      {error ? <AppText style={[styles.error, textAlign]}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  sectionTitle: { fontWeight: '800', color: colors.ink, marginBottom: 8 },
  videoTitle: { marginTop: 12 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6 },
  imageGrid: { flexWrap: 'wrap', gap: 8 },
  thumb: { width: 88, height: 88, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#eef2f7' },
  thumbImage: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addTile: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: colors.surface
  },
  addTileWide: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    gap: 4
  },
  addText: { color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  videoRow: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft
  },
  videoReady: { flex: 1, fontWeight: '700', color: colors.ink },
  removeText: { color: colors.danger, fontWeight: '800' },
  error: { color: colors.danger, fontWeight: '700', marginTop: 8 },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' }
});
