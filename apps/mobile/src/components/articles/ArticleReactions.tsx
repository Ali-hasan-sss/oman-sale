import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { useI18n } from '../../i18n';
import {
  fetchArticleReactions,
  removeArticleReaction,
  setArticleReaction,
  type ArticleReactionsData,
  type ReactionType
} from '../../services/articles.service';
import { colors, radius } from '../../theme';

const REACTION_ORDER: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'DISLIKE'];

type ArticleReactionsProps = {
  articleId: string;
  onLoginRequired: () => void;
  isLoggedIn: boolean;
};

export function ArticleReactions({ articleId, onLoginRequired, isLoggedIn }: ArticleReactionsProps) {
  const { t } = useI18n();
  const text = t.articles;
  const [data, setData] = useState<ArticleReactionsData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArticleReactions(articleId)
      .then(setData)
      .catch(() => setData(null));
  }, [articleId]);

  const react = async (type: ReactionType) => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    setLoading(true);
    try {
      if (data?.userReaction === type) {
        setData(await removeArticleReaction(articleId));
      } else {
        setData(await setArticleReaction(articleId, type));
      }
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  const activeEmoji = data.userReaction ? data.emojis[data.userReaction] : '👍';
  const topReactions = REACTION_ORDER.filter((type) => data.counts[type] > 0)
    .sort((a, b) => data.counts[b] - data.counts[a])
    .slice(0, 3);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.reactButton, data.userReaction && styles.reactButtonActive]}
        onPress={() => {
          if (!isLoggedIn) {
            onLoginRequired();
            return;
          }
          setOpen(true);
        }}
        disabled={loading}
      >
        <AppText style={styles.reactEmoji}>{activeEmoji}</AppText>
        <AppText style={[styles.reactLabel, data.userReaction && styles.reactLabelActive]}>
          {data.userReaction ? text.reacted : text.react}
        </AppText>
      </Pressable>

      {data.total > 0 ? (
        <View style={styles.summary}>
          {topReactions.map((type) => (
            <AppText key={type} style={styles.summaryEmoji}>
              {data.emojis[type]}
            </AppText>
          ))}
          <AppText style={styles.summaryCount}>{data.total}</AppText>
        </View>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.picker}>
            <View style={styles.pickerGrid}>
              {REACTION_ORDER.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.pickerItem, data.userReaction === type && styles.pickerItemActive]}
                  onPress={() => void react(type)}
                  disabled={loading}
                >
                  <AppText style={styles.pickerEmoji}>{data.emojis[type]}</AppText>
                  {data.counts[type] > 0 ? (
                    <AppText style={styles.pickerCount}>{data.counts[type]}</AppText>
                  ) : null}
                </Pressable>
              ))}
            </View>
            {loading ? <ActivityIndicator color={colors.brand} style={styles.pickerLoader} /> : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    marginBottom: 8
  },
  reactButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface
  },
  reactButtonActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  reactEmoji: {
    fontSize: 20
  },
  reactLabel: {
    fontWeight: '800',
    color: colors.ink
  },
  reactLabelActive: {
    color: colors.brandDark
  },
  summary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 10
  },
  summaryEmoji: {
    fontSize: 16
  },
  summaryCount: {
    fontWeight: '800',
    color: colors.muted,
    marginStart: 4
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
    padding: 18
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16
  },
  pickerGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8
  },
  pickerItem: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  pickerItemActive: {
    backgroundColor: colors.brandSoft,
    borderWidth: 2,
    borderColor: colors.brand
  },
  pickerEmoji: {
    fontSize: 28
  },
  pickerCount: {
    position: 'absolute',
    bottom: 4,
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted
  },
  pickerLoader: {
    marginTop: 12
  }
});
