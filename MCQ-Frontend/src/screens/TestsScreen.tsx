import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography, shadow } from '../theme';
import BackHeader from '../components/ui/BackHeader';
import DailyLimitModal from '../components/ui/DailyLimitModal';
import { getDistinctYears, generateRandomTest } from '../services/mcq.service';

type FilterType = 'year' | 'subject';
type TestMode = 'select' | 'random';

const ALL_SUBJECTS = [
  { name: 'Chemistry', icon: 'flask' as const, color: '#8B5CF6' },
  { name: 'Physics', icon: 'nuclear' as const, color: '#3B82F6' },
  { name: 'Maths', icon: 'calculator' as const, color: '#10B981' },
  { name: 'Biology', icon: 'leaf' as const, color: '#F59E0B' },
];

const GROUP_SUBJECTS: Record<string, string[]> = {
  PCM: ['Chemistry', 'Physics', 'Maths'],
  PCB: ['Chemistry', 'Physics', 'Biology'],
  PCMB: ['Chemistry', 'Physics', 'Maths', 'Biology'],
};

const RANDOM_OPTIONS = [
  { count: 10, label: '10 Questions', desc: 'Quick practice' },
  { count: 50, label: '50 Questions', desc: 'Medium session' },
  { count: 100, label: '100 Questions', desc: 'Full practice' },
];

export default function TestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';

  const SUBJECTS = useMemo(() => {
    if (!user?.group) return ALL_SUBJECTS;
    const allowed = GROUP_SUBJECTS[user.group] || [];
    return ALL_SUBJECTS.filter((s) => allowed.includes(s.name));
  }, [user?.group]);

  const [showOptions, setShowOptions] = useState(false);
  const [testMode, setTestMode] = useState<TestMode>('select');
  const [filter, setFilter] = useState<FilterType>('year');
  const [years, setYears] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingRandom, setGeneratingRandom] = useState<number | null>(null);
  const [generatingYear, setGeneratingYear] = useState<string | null>(null);
  const [generatingSubject, setGeneratingSubject] = useState<string | null>(null);
  const [testLimitModalVisible, setTestLimitModalVisible] = useState(false);

  useEffect(() => {
    if (filter === 'year') {
      let mounted = true;
      setLoadingYears(true);
      setError(null);
      getDistinctYears()
        .then((r) => mounted && setYears(Array.isArray(r?.data) ? r.data : []))
        .catch((e) =>
          mounted && setError(e instanceof Error ? e.message : 'Failed to load years')
        )
        .finally(() => mounted && setLoadingYears(false));
      return () => { mounted = false; };
    }
  }, [filter]);

  const checkTestLimit = async (): Promise<boolean> => {
    if (isPremium) return true;
    const { getTestCount, canTakeTest } = await import('../utils/testTracking');
    if (!canTakeTest(false, await getTestCount())) {
      setTestLimitModalVisible(true);
      return false;
    }
    return true;
  };

  const runRandom = async (n: number) => {
    if (!(await checkTestLimit())) return;
    setGeneratingRandom(n);
    setError(null);
    try {
      const { data } = await generateRandomTest(n);
      if (!isPremium) {
        const { incrementTestCount } = await import('../utils/testTracking');
        await incrementTestCount();
      }
      navigation.navigate('CBT', { testId: data.sessionId, questions: data.questions });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start test');
    } finally {
      setGeneratingRandom(null);
    }
  };

  const runYear = async (year: string) => {
    if (!(await checkTestLimit())) return;
    setGeneratingYear(year);
    setError(null);
    try {
      const { data } = await generateRandomTest(25, year);
      if (!isPremium) {
        const { incrementTestCount } = await import('../utils/testTracking');
        await incrementTestCount();
      }
      navigation.navigate('CBT', { testId: data.sessionId, questions: data.questions });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start test');
    } finally {
      setGeneratingYear(null);
    }
  };

  const runSubject = async (name: string) => {
    if (!(await checkTestLimit())) return;
    setGeneratingSubject(name);
    setError(null);
    try {
      const { data } = await generateRandomTest(25, undefined, name);
      if (!isPremium) {
        const { incrementTestCount } = await import('../utils/testTracking');
        await incrementTestCount();
      }
      navigation.navigate('CBT', { testId: data.sessionId, questions: data.questions });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start test');
    } finally {
      setGeneratingSubject(null);
    }
  };

  const retryYears = () => {
    setError(null);
    setLoadingYears(true);
    getDistinctYears()
      .then((r) => {
        setError(null);
        setYears(Array.isArray(r?.data) ? r.data : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load years'))
      .finally(() => setLoadingYears(false));
  };

  // —— Error (years) ——
  if (error && years.length === 0 && !loadingYears && filter === 'year' && showOptions) {
    return (
      <View style={s.screen}>
        <LinearGradient colors={['#F5F3FF', '#EDE9FE'] as [string, string]} style={s.gradient}>
          <View style={{ height: insets.top }} />
          <BackHeader
            title="PYQ Tests"
            subtitle="Previous Year Questions"
            onBack={() => { setShowOptions(false); setError(null); }}
          />
          <View style={s.errorWrap}>
            <View style={s.errorIconWrap}>
              <Ionicons name="cloud-offline" size={32} color={colors.danger} />
            </View>
            <Text style={s.errorTitle}>Couldn’t load years</Text>
            <Text style={s.errorMsg}>{error}</Text>
            <TouchableOpacity onPress={retryYears} activeOpacity={0.8} style={s.retryWrap}>
              <LinearGradient
                colors={colors.gradientPrimary as [string, string]}
                style={s.retryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={s.retryTxt}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#F5F3FF', '#EDE9FE'] as [string, string]} style={s.gradient}>
        {/* Header */}
        {showOptions ? (
          <>
            <View style={{ height: insets.top }} />
            <BackHeader
              title="PYQ Tests"
              subtitle="Previous Year Questions"
              onBack={() => setShowOptions(false)}
            />
          </>
        ) : (
          <>
            <View style={{ height: insets.top }} />
            <View style={s.header}>
              <Text style={s.heroTitle}>PYQ Tests</Text>
              <Text style={s.heroSub}>Previous year questions · MHT CET</Text>
            </View>
          </>
        )}

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: 24 + insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* —— Landing: 2 main actions —— */}
          {!showOptions && (
            <View style={s.landing}>
              <TouchableOpacity
                onPress={() => setShowOptions(true)}
                activeOpacity={0.7}
                style={s.actionCard}
              >
                <View style={s.actionIconWrap}>
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string]}
                    style={s.actionIconGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="document-text" size={26} color="#FFF" />
                  </LinearGradient>
                </View>
                <View style={s.actionBody}>
                  <Text style={s.actionTitle}>PYQ Practice</Text>
                  <Text style={s.actionSub}>By year, subject or random</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.authTextMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('MockTestSelection')}
                activeOpacity={0.7}
                style={s.actionCard}
              >
                <View style={[s.actionIconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="trophy" size={26} color={colors.accent} />
                </View>
                <View style={s.actionBody}>
                  <Text style={s.actionTitle}>Mock Test</Text>
                  <Text style={s.actionSub}>Full-length MHT CET papers</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.authTextMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* —— Options: Random | Select, then list —— */}
          {showOptions && (
            <View style={s.optionsCard}>
              {/* Mode: Random | Select */}
              <View style={s.pillRow}>
                <TouchableOpacity
                  style={[s.pill, testMode === 'random' && s.pillActive]}
                  onPress={() => setTestMode('random')}
                  activeOpacity={0.7}
                >
                  {testMode === 'random' ? (
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string]}
                      style={s.pillInner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="shuffle" size={16} color="#FFF" />
                      <Text style={s.pillTxtActive}>Random</Text>
                    </LinearGradient>
                  ) : (
                    <View style={s.pillInnerPlain}>
                      <Ionicons name="shuffle-outline" size={16} color={colors.authTextMuted} />
                      <Text style={s.pillTxt}>Random</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.pill, testMode === 'select' && s.pillActive]}
                  onPress={() => setTestMode('select')}
                  activeOpacity={0.7}
                >
                  {testMode === 'select' ? (
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string]}
                      style={s.pillInner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="list" size={16} color="#FFF" />
                      <Text style={s.pillTxtActive}>Select</Text>
                    </LinearGradient>
                  ) : (
                    <View style={s.pillInnerPlain}>
                      <Ionicons name="list-outline" size={16} color={colors.authTextMuted} />
                      <Text style={s.pillTxt}>Select</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {testMode === 'random' && (
                <View style={s.listBlock}>
                  <Text style={s.listBlockTitle}>Choose length</Text>
                  <Text style={s.listBlockSub}>Quick practice or full session</Text>
                  <View style={s.list}>
                    {RANDOM_OPTIONS.map((o) => (
                      <TouchableOpacity
                        key={o.count}
                        onPress={() => runRandom(o.count)}
                        disabled={generatingRandom === o.count}
                        activeOpacity={0.7}
                        style={s.row}
                      >
                        <View style={s.rowIcon}>
                          <Ionicons name="book-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={s.rowText}>
                          <Text style={s.rowTitle}>{o.label}</Text>
                          <Text style={s.rowSub}>{o.desc}</Text>
                        </View>
                        {generatingRandom === o.count ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {testMode === 'select' && (
                <>
                  {/* Filter: By Year | By Subject */}
                  <View style={s.pillRow}>
                    <TouchableOpacity
                      style={[s.pillSmall, filter === 'year' && s.pillSmallActive]}
                      onPress={() => setFilter('year')}
                      activeOpacity={0.7}
                    >
                      {filter === 'year' ? (
                        <LinearGradient
                          colors={colors.gradientPrimary as [string, string]}
                          style={s.pillSmallInner}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={s.pillSmallTxtActive}>By Year</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={s.pillSmallTxt}>By Year</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.pillSmall, filter === 'subject' && s.pillSmallActive]}
                      onPress={() => setFilter('subject')}
                      activeOpacity={0.7}
                    >
                      {filter === 'subject' ? (
                        <LinearGradient
                          colors={colors.gradientPrimary as [string, string]}
                          style={s.pillSmallInner}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={s.pillSmallTxtActive}>By Subject</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={s.pillSmallTxt}>By Subject</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={s.listBlock}>
                    {filter === 'year' && loadingYears && (
                      <View style={s.loadWrap}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={s.loadTxt}>Loading years…</Text>
                      </View>
                    )}

                    {filter === 'year' && !loadingYears && years.length === 0 && (
                      <View style={s.emptyWrap}>
                        <Ionicons name="calendar-outline" size={40} color={colors.authTextMuted} />
                        <Text style={s.emptyTitle}>No years found</Text>
                        <Text style={s.emptySub}>Try the Random option</Text>
                      </View>
                    )}

                    {filter === 'year' && !loadingYears && years.length > 0 && (
                      <View style={s.list}>
                        {years.map((y) => (
                          <TouchableOpacity
                            key={y}
                            onPress={() => runYear(y)}
                            disabled={generatingYear === y}
                            activeOpacity={0.7}
                            style={s.row}
                          >
                            <View style={s.rowIcon}>
                              <Ionicons name="calendar" size={20} color={colors.primary} />
                            </View>
                            <View style={s.rowText}>
                              <Text style={s.rowTitle}>MHT CET {y}</Text>
                              <Text style={s.rowSub}>25 questions from {y}</Text>
                            </View>
                            {generatingYear === y ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {filter === 'subject' && (
                      <View style={s.list}>
                        {SUBJECTS.map((sub) => (
                          <TouchableOpacity
                            key={sub.name}
                            onPress={() => runSubject(sub.name)}
                            disabled={generatingSubject === sub.name}
                            activeOpacity={0.7}
                            style={s.row}
                          >
                            <View style={[s.rowIcon, { backgroundColor: `${sub.color}18` }]}>
                              <Ionicons name={sub.icon} size={20} color={sub.color} />
                            </View>
                            <View style={s.rowText}>
                              <Text style={s.rowTitle}>{sub.name}</Text>
                              <Text style={s.rowSub}>25 questions from {sub.name}</Text>
                            </View>
                            {generatingSubject === sub.name ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="chevron-forward" size={20} color={colors.authTextMuted} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
      <DailyLimitModal
        visible={testLimitModalVisible}
        type="tests"
        onClose={() => setTestLimitModalVisible(false)}
        onUpgrade={() => {
          setTestLimitModalVisible(false);
          navigation.navigate('PremiumPurchase');
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  gradient: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  heroTitle: { ...typography.h1, color: colors.authText, fontWeight: '800', marginBottom: 4 },
  heroSub: { ...typography.body, color: colors.authTextSecondary, fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, flexGrow: 1 },

  landing: { gap: spacing.md },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.sm,
    elevation: 2,
  },
  actionIconWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden' },
  actionIconGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  actionBody: { flex: 1, marginLeft: spacing.lg },
  actionTitle: { ...typography.title, color: colors.authText, fontWeight: '700', marginBottom: 2 },
  actionSub: { ...typography.small, color: colors.authTextSecondary },

  optionsCard: {
    backgroundColor: '#FFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.sm,
    elevation: 2,
  },
  pillRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: spacing.xl },
  pill: { flex: 1, borderRadius: 10, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pillActive: {},
  pillInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  pillInnerPlain: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  pillTxt: { ...typography.subtitle, color: colors.authTextMuted, fontWeight: '600', fontSize: 14 },
  pillTxtActive: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  pillSmall: { flex: 1, borderRadius: 10, overflow: 'hidden', marginBottom: spacing.lg },
  pillSmallActive: {},
  pillSmallInner: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  pillSmallTxt: { ...typography.subtitle, color: colors.authTextMuted, fontWeight: '600', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
  pillSmallTxtActive: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  listBlock: { marginTop: 0 },
  listBlockTitle: { ...typography.subtitle, color: colors.authText, fontWeight: '600', marginBottom: 2 },
  listBlockSub: { ...typography.small, color: colors.authTextSecondary, marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowText: { flex: 1 },
  rowTitle: { ...typography.subtitle, color: colors.authText, fontWeight: '600', marginBottom: 2 },
  rowSub: { ...typography.small, color: colors.authTextSecondary },

  loadWrap: { paddingVertical: spacing.xxxl, alignItems: 'center', gap: spacing.md },
  loadTxt: { ...typography.body, color: colors.authTextSecondary },
  emptyWrap: { paddingVertical: spacing.xxxl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { ...typography.subtitle, color: colors.authText, fontWeight: '600' },
  emptySub: { ...typography.small, color: colors.authTextMuted },

  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  errorIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.danger}14`, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  errorTitle: { ...typography.h3, color: colors.authText, fontWeight: '700', marginBottom: spacing.xs },
  errorMsg: { ...typography.body, color: colors.authTextSecondary, textAlign: 'center', marginBottom: spacing.xl },
  retryWrap: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  retryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl },
  retryTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
