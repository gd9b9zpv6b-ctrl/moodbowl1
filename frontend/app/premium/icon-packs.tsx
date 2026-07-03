import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ICON_PACKS } from '@/src/constants/diary-style';
import { COLORS, RADIUS, SPACING } from '@/src/constants/theme';
import { api, User } from '@/src/lib/api';
import { useAuth } from '@/src/lib/auth-context';

export default function IconPacksScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const active = user?.active_icon_pack || 'classic';

  const select = async (key: string, locked: boolean) => {
    if (locked) return;
    try {
      await api.patch<User>('/premium/settings', { active_icon_pack: key });
      await refreshUser();
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable testID="packs-back" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>飯碗系列</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          揀返一款你最鍾意嘅系列陪你記錄心情。更多系列會陸續推出。
        </Text>
        {ICON_PACKS.map((p) => {
          const isActive = active === p.key;
          return (
            <Pressable
              key={p.key}
              testID={`pack-${p.key}`}
              onPress={() => select(p.key, p.locked)}
              style={[
                styles.card,
                { backgroundColor: p.color + '55' },
                isActive && styles.cardActive,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: p.color }]}>
                <Feather
                  name={p.locked ? 'lock' : 'grid'}
                  size={20}
                  color={COLORS.textPrimary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{p.label}</Text>
                <Text style={styles.cardDesc}>{p.desc}</Text>
              </View>
              {isActive ? (
                <View style={styles.activeBadge}>
                  <Feather name="check" size={14} color={COLORS.textPrimary} />
                  <Text style={styles.activeText}>使用中</Text>
                </View>
              ) : p.locked ? (
                <Text style={styles.comingText}>即將推出</Text>
              ) : (
                <Feather name="chevron-right" size={20} color={COLORS.textDisabled} />
              )}
            </Pressable>
          );
        })}
        <Text style={styles.footer}>
          有想睇嘅主題? 話俾我哋知,可能會出現喺下個系列 🌿
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  intro: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.lg },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardActive: { borderColor: COLORS.textPrimary },
  iconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.bgCard,
  },
  activeText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  comingText: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    backgroundColor: COLORS.bgCard, paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: RADIUS.pill,
  },
  footer: {
    marginTop: SPACING.xl, color: COLORS.textSecondary,
    textAlign: 'center', fontSize: 13, lineHeight: 20,
  },
});
