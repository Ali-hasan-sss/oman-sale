import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { resolveDeviceMediaUrl } from '../lib/media-url';
import { isAdVideoTooLarge, uploadAdMedia } from '../services/media.service';
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
    videoTooLarge: string;
  };
  isRtl: boolean;
  disabled?: boolean;
};

function MediaThumb({ reference, localUri }: { reference: string; localUri?: string }) {
  const remoteUri = resolveDeviceMediaUrl(reference);
  const initialUri = localUri || remoteUri;
  const [uri, setUri] = useState(initialUri);

  useEffect(() => {
    if (localUri) setUri(localUri);
  }, [localUri]);

  return (
    <Image
      source={{ uri }}
      style={styles.thumbImage}
      resizeMode="cover"
      onError={() => {
        if (remoteUri && uri !== remoteUri) setUri(remoteUri);
      }}
    />
  );
}

function VideoPreview({ reference, localUri }: { reference: string; localUri?: string }) {
  const remoteUri = resolveDeviceMediaUrl(reference);
  const uri = localUri || remoteUri;
  const [sourceUri, setSourceUri] = useState(uri);

  useEffect(() => {
    if (localUri) setSourceUri(localUri);
  }, [localUri]);

  return (
    <Video
      source={{ uri: sourceUri }}
      style={styles.videoPlayer}
      useNativeControls
      resizeMode={ResizeMode.COVER}
      shouldPlay={false}
      onError={() => {
        if (remoteUri && sourceUri !== remoteUri) setSourceUri(remoteUri);
      }}
    />
  );
}

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
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
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
        setPreviews((current) => ({ ...current, [media.key]: asset.uri }));
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
    if (isAdVideoTooLarge(asset.fileSize)) {
      setError(labels.videoTooLarge);
      return;
    }

    setPendingVideoUri(asset.uri);
    setUploadingVideo(true);
    try {
      const media = await uploadAdMedia({
        uri: asset.uri,
        name: asset.fileName || `listing-video-${Date.now()}.mp4`,
        mimeType: asset.mimeType || guessMimeType(asset.uri, 'video'),
        size: asset.fileSize,
        kind: 'video'
      });
      setPreviews((current) => ({ ...current, [media.key]: asset.uri }));
      onVideoUrlChange(media.key);
    } catch (caught) {
      setPendingVideoUri(null);
      const tooLarge = caught instanceof Error && caught.message === 'AD_FILE_TOO_LARGE';
      setError(tooLarge ? labels.videoTooLarge : labels.uploadError);
    } finally {
      setUploadingVideo(false);
    }
  };

  const clearVideo = () => {
    setPendingVideoUri(null);
    onVideoUrlChange(null);
  };

  return (
    <View style={styles.wrap}>
      <AppText style={[styles.sectionTitle, textAlign]}>{labels.images}</AppText>
      <View style={[styles.imageGrid, rowDirection(isRtl)]}>
        {imageUrls.map((url, index) => (
          <View key={`${url}-${index}`} style={styles.thumb}>
            <View style={styles.thumbMedia} pointerEvents="none">
              <MediaThumb reference={url} localUri={previews[url]} />
            </View>
            <Pressable
              style={[styles.remove, insetEnd(isRtl, 4)]}
              hitSlop={10}
              onPress={() => onImageUrlsChange(imageUrls.filter((_, current) => current !== index))}
              disabled={disabled}
              accessibilityLabel={labels.removeImage}
            >
              <Ionicons name="close" size={16} color="#fff" />
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
      {videoUrl || pendingVideoUri ? (
        <View style={styles.videoBlock}>
          <View style={styles.videoPreview}>
            {videoUrl ? (
              <VideoPreview reference={videoUrl} localUri={previews[videoUrl] || pendingVideoUri || undefined} />
            ) : pendingVideoUri ? (
              <Video
                source={{ uri: pendingVideoUri }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
              />
            ) : null}
            {uploadingVideo ? (
              <View style={styles.videoUploading} pointerEvents="none">
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </View>
          <Pressable
            style={[styles.removeVideo, rowDirection(isRtl)]}
            onPress={clearVideo}
            disabled={disabled || uploadingVideo}
            accessibilityLabel={labels.removeImage}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
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
  thumb: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: '#eef2f7' },
  thumbMedia: { ...StyleSheet.absoluteFillObject, borderRadius: radius.md, overflow: 'hidden' },
  thumbImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  remove: {
    position: 'absolute',
    top: 4,
    zIndex: 2,
    elevation: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.72)',
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
  videoBlock: { gap: 8 },
  videoPreview: {
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#111827'
  },
  removeVideo: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8
  },
  removeText: { color: colors.danger, fontWeight: '800' },
  videoPlayer: { width: '100%', height: '100%' },
  videoUploading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  error: { color: colors.danger, fontWeight: '700', marginTop: 8 },
  rtl: { textAlign: 'right' },
  ltr: { textAlign: 'left' }
});
