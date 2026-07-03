import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTIONS } from '@/src/constants/emotions';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';

const UNLOCK_COST = 3;

type Props = {
  visible: boolean;
  currentKey: string | null;
  harvests: Record<string, number>;
  rice: number;
  onClose: () => void;
  onSelect: (key: string, riceSpent: number) => void;
};

export function AvatarPickerModal({
  visible,
  currentKey,
  harvests,
  rice,
  onClose,
  onSelect,
}: Props) {
  const items = useMemo(() => {
    return EMOTIONS.map((e) => ({
      emotion: e,
      harvested: (harvests[e.key] || 0) > 0,
      count: harvests[e.key] || 0,
    })).sort((a, b) => {
      // Harvested first, then by count desc
      if (a.harvested !== b.harvested) return a.harvested ? -1 : 1;
      return b.count - a.count;
    });
  }, [harvests]);

  const handleTap = (key: string, harvested: boolean) => {
    if (key === currentKey) return;
    if (harvested) {
      // Free to switch
      onSelect(key, 0);
    } else {
      // Confirm & spend rice
      if (rice < UNLOCK_COST) {
        Alert.alert(
          '米倉唔夠',
          `解鎖新飯碗要 ${UNLOCK_COST} 粒米 · 你依家有 ${rice} 粒。去稻田種多啲米？`,
        );
        return;
      }
      Alert.alert(
        '解鎖新飯碗',
        `用 ${UNLOCK_COST} 粒 🍚 解鎖呢隻飯碗做頭像？`,
        [
          { text: '再諗諗', style: 'cancel' },
          {
            text: `解鎖 (-${UNLOCK_COST} 粒米)`,
            onPress: () => onSelect(key, UNLOCK_COST),
          },
        ],
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>揀你嘅頭像</Text>
              <Text style={styles.sub}>
                收成過嘅飯碗 · 免費揀 ·
                {' '}未收成 · 用 <Text style={styles.riceHl}>{UNLOCK_COST} 🍚</Text> 解鎖
              </Text>
            </View>
            <View style={styles.riceCount}>
              <Text style={styles.riceEmoji}>🍚</Text>
              <Text style={styles.riceCountText}>{rice}</Text>
            </View>
            <Pressable testID="avatar-close" onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {items.map(({ emotion, harvested, count }) => {
              const selected = emotion.key === currentKey;
              return (
                <Pressable
                  key={emotion.key}
                  testID={`avatar-pick-${emotion.key}`}
                  onPress={() => handleTap(emotion.key, harvested)}
                  style={[
                    styles.cell,
                    selected && styles.cellSelected,
                    !harvested && styles.cellLocked,
                  ]}
                >
                  <View style={styles.bowlWrap}>
                    <EmotionVisual emotion={emotion} size={56} radius={RADIUS.sm} />
                    {!harvested && (
                      <View style={styles.lockOverlay}>
                        <Feather name="lock" size={16} color="#FFF" />
                      </View>
                    )}
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Feather name="check" size={12} color="#FFF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.cellLabel} numberOfLines={1}>
                    {emotion.label}
                  </Text>
                  {harvested ? (
                    count > 1 && (
                      <Text style={styles.cellCount}>×{count}</Text>
                    )
                  ) : (
                    <Text style={styles.cellCost}>{UNLOCK_COST} 🍚</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  riceHl: { fontWeight: '800', color: '#B57D2A' },
  riceCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFF3D6',
  },
  riceEmoji: { fontSize: 16 },
  riceCountText: { fontSize: 14, fontWeight: '800', color: '#B57D2A' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  cell: {
    width: '31%',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgInput,
  },
  cellSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cellLocked: {
    opacity: 0.65,
  },
  bowlWrap: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  cellCount: { fontSize: 10, color: '#B57D2A', fontWeight: '700', marginTop: 2 },
  cellCost: { fontSize: 10, fontWeight: '800', color: '#B57D2A', marginTop: 2 },
});
