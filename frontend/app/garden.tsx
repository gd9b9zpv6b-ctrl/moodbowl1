import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionVisual } from '@/src/components/emotion-visual';
import { EMOTION_BY_KEY } from '@/src/constants/emotions';
import {
  HEART_COST,
  Plot,
  PlotStage,
  STAGE_EMOJI,
  STAGE_LABEL,
  computeStage,
  pickRandomCropKey,
  timeToNextStage,
} from '@/src/constants/garden';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { GardenStorage } from '@/src/lib/garden-storage';

function fmt(ms: number): string {
  if (ms <= 0) return '成熟';
  if (ms < 60_000) return `${Math.ceil(ms / 1000)} 秒`;
  const m = Math.ceil(ms / 60_000);
  if (m < 60) return `${m} 分`;
  const h = Math.floor(m / 60);
  return `${h} 小時`;
}

function PlotCard({
  plot,
  demo,
  onPlant,
  onHarvest,
}: {
  plot: Plot;
  demo: boolean;
  onPlant: () => void;
  onHarvest: () => void;
}) {
  // Pulse animation for ready plots
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (plot.stage !== 'ready') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [plot.stage, pulse]);

  const isEmpty = plot.stage === 'empty';
  const isReady = plot.stage === 'ready';
  const emotion = plot.cropKey ? EMOTION_BY_KEY[plot.cropKey] : null;

  const handlePress = () => {
    if (isEmpty) onPlant();
    else if (isReady) onHarvest();
  };

  const remaining = plot.plantedAt && !isReady ? timeToNextStage(plot.plantedAt, demo) : 0;

  return (
    <Pressable
      testID={`plot-${plot.id}`}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.plot,
        isEmpty && styles.plotEmpty,
        isReady && styles.plotReady,
        pressed && { opacity: 0.85 },
      ]}
    >
      {isEmpty ? (
        <>
          <Feather name="plus" size={28} color={COLORS.textSecondary} />
          <Text style={styles.plotEmptyHint}>撳我{'\n'}種嘢</Text>
        </>
      ) : (
        <Animated.View style={[styles.plotContent, { transform: [{ scale: pulse }] }]}>
          {isReady && emotion ? (
            <View style={styles.readyBowlWrap}>
              <EmotionVisual emotion={emotion} size={64} radius={RADIUS.md} />
            </View>
          ) : (
            <Text style={styles.plotEmoji}>{STAGE_EMOJI[plot.stage]}</Text>
          )}
          <Text style={styles.plotStage}>{STAGE_LABEL[plot.stage]}</Text>
          {!isReady && (
            <Text style={styles.plotTimer}>
              <Feather name="clock" size={10} color={COLORS.textSecondary} /> {fmt(remaining)}
            </Text>
          )}
          {isReady && <Text style={styles.plotReadyLabel}>撳我收成 🎉</Text>}
        </Animated.View>
      )}
    </Pressable>
  );
}

function HarvestModal({
  visible,
  cropKey,
  onClose,
}: {
  visible: boolean;
  cropKey: string | null;
  onClose: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const emotion = cropKey ? EMOTION_BY_KEY[cropKey] : null;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scale]);

  if (!emotion) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.harvestCard}>
          <Text style={styles.harvestTitle}>🎉 收成啦</Text>
          <Animated.View style={{ transform: [{ scale }], marginVertical: SPACING.lg }}>
            <EmotionVisual emotion={emotion} size={180} radius={RADIUS.lg} />
          </Animated.View>
          <Text style={styles.harvestSub}>你種出咗一碗</Text>
          <Text style={styles.harvestBowl}>「{emotion.label}」</Text>
          <Text style={styles.harvestGain}>+1 粒 🍚 收入米倉</Text>
          <Pressable testID="harvest-close" onPress={onClose} style={styles.harvestBtn}>
            <Text style={styles.harvestBtnText}>好，繼續種</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function Garden() {
  const router = useRouter();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [hearts, setHearts] = useState(0);
  const [rice, setRice] = useState(0);
  const [demo, setDemo] = useState(true);
  const [ready, setReady] = useState(false);
  const [harvestKey, setHarvestKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load state on mount
  const load = useCallback(async () => {
    const [p, h, r, d] = await Promise.all([
      GardenStorage.getPlots(),
      GardenStorage.getHearts(),
      GardenStorage.getRice(),
      GardenStorage.getDemo(),
    ]);
    // Compute current stages based on plantedAt
    const updated = p.map((plot) =>
      plot.plantedAt
        ? { ...plot, stage: computeStage(plot.plantedAt, d) }
        : plot,
    );
    setPlots(updated);
    setHearts(h);
    setRice(r);
    setDemo(d);
    setReady(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ticker: recompute stages every second (demo mode) or every minute (real mode)
  useEffect(() => {
    if (!ready) return;
    const interval = demo ? 500 : 60_000;
    const t = setInterval(() => {
      setPlots((prev) =>
        prev.map((p) =>
          p.plantedAt ? { ...p, stage: computeStage(p.plantedAt, demo) } : p,
        ),
      );
    }, interval);
    return () => clearInterval(t);
  }, [demo, ready]);

  const persistPlots = async (next: Plot[]) => {
    setPlots(next);
    await GardenStorage.setPlots(next);
  };

  const plantSeed = async (plotId: number) => {
    if (hearts < HEART_COST) {
      // Can't plant — silently return; UI shows the count
      return;
    }
    const cropKey = pickRandomCropKey();
    const next = plots.map((p) =>
      p.id === plotId
        ? { ...p, stage: 'seed' as PlotStage, plantedAt: Date.now(), cropKey }
        : p,
    );
    await persistPlots(next);
    const newHearts = hearts - HEART_COST;
    setHearts(newHearts);
    await GardenStorage.setHearts(newHearts);
  };

  const harvest = async (plotId: number) => {
    const plot = plots.find((p) => p.id === plotId);
    if (!plot || plot.stage !== 'ready' || !plot.cropKey) return;
    setHarvestKey(plot.cropKey);
    setModalVisible(true);
    // Reset plot to empty
    const next = plots.map((p) =>
      p.id === plotId ? { id: p.id, stage: 'empty' as PlotStage } : p,
    );
    await persistPlots(next);
    const newRice = rice + 1;
    setRice(newRice);
    await GardenStorage.setRice(newRice);
    await GardenStorage.addHarvest(plot.cropKey);
  };

  const toggleDemo = async (v: boolean) => {
    setDemo(v);
    await GardenStorage.setDemo(v);
  };

  // Convenient demo helpers (only shown in demo mode)
  const addHearts = async () => {
    const n = hearts + 3;
    setHearts(n);
    await GardenStorage.setHearts(n);
  };

  const resetAll = async () => {
    await GardenStorage.reset();
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          testID="garden-back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>🌾 我嘅稻田</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>用你嘅小習慣 · 種一粒米</Text>
          <Text style={styles.heroSub}>
            每完成一個小習慣得 ❤️ · 用 {HEART_COST} ❤️ 種一粒米。{'\n'}
            慢慢生長 · 收成解鎖一碗新心情。
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>❤️</Text>
            <View>
              <Text style={styles.statLabel}>心心</Text>
              <Text style={styles.statValue}>{hearts}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🍚</Text>
            <View>
              <Text style={styles.statLabel}>米倉</Text>
              <Text style={styles.statValue}>{rice}</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          {plots.map((p) => (
            <PlotCard
              key={p.id}
              plot={p}
              demo={demo}
              onPlant={() => plantSeed(p.id)}
              onHarvest={() => harvest(p.id)}
            />
          ))}
        </View>

        {hearts < HEART_COST && (
          <View style={styles.warningCard}>
            <Feather name="info" size={13} color="#8A7B6B" />
            <Text style={styles.warningText}>
              仲差 {HEART_COST - hearts} ❤️ 就可以種一粒。去「小習慣」tab 完成一個習慣就有 ❤️。
            </Text>
          </View>
        )}

        <View style={styles.demoCard}>
          <View style={styles.demoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>⏩ Demo 加速模式</Text>
              <Text style={styles.demoSub}>
                {demo
                  ? '3 秒代替 3 日 · Pitch 順暢'
                  : '真實模式 · 每階段要 24 小時'}
              </Text>
            </View>
            <Switch
              testID="demo-toggle"
              value={demo}
              onValueChange={toggleDemo}
              trackColor={{ true: COLORS.primary, false: COLORS.bgInput }}
              thumbColor={COLORS.bgCard}
            />
          </View>
          {demo && (
            <View style={styles.demoBtnRow}>
              <Pressable
                testID="add-hearts-btn"
                onPress={addHearts}
                style={styles.demoBtn}
              >
                <Feather name="plus" size={14} color={COLORS.textPrimary} />
                <Text style={styles.demoBtnText}>+3 ❤️（模擬完成習慣）</Text>
              </Pressable>
              <Pressable
                testID="reset-garden-btn"
                onPress={resetAll}
                style={[styles.demoBtn, { backgroundColor: '#FFE4E4' }]}
              >
                <Feather name="refresh-cw" size={14} color="#E86A6A" />
                <Text style={[styles.demoBtnText, { color: '#E86A6A' }]}>重置</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      <HarvestModal
        visible={modalVisible}
        cropKey={harvestKey}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF6E8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xs },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#7BA88C',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statEmoji: { fontSize: 26 },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  plot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: '#D6E8CB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  plotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#B5D4A4',
  },
  plotReady: {
    backgroundColor: '#FFF3D6',
  },
  plotEmptyHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  plotContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotEmoji: { fontSize: 36 },
  readyBowlWrap: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  plotStage: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  plotTimer: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  plotReadyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C7955B',
    marginTop: 2,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF5E6',
    marginBottom: SPACING.md,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#7A5C3F',
    lineHeight: 18,
  },
  demoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  demoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  demoSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  demoBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgInput,
  },
  demoBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  harvestCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  harvestTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  harvestSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  harvestBowl: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  harvestGain: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontWeight: '700',
    color: '#7BA88C',
  },
  harvestBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
  },
  harvestBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
