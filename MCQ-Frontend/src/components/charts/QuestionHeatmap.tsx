import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type HeatmapDatum = {
  date: string; // YYYY-MM-DD
  count: number;
};

type Props = {
  data: HeatmapDatum[];
};

const CELL_SIZE = 14;
const CELL_GAP = 4;

const COLOR_STOPS = [
  { min: 0, color: colors.authInputBg },
  { min: 1, color: '#DCFCE7' },
  { min: 5, color: '#BBF7D0' },
  { min: 10, color: '#34D399' },
  { min: 25, color: '#047857' },
];

const dayLabels = ['Mon', 'Wed', 'Fri'];

const getColorForCount = (count: number) => {
  for (let i = COLOR_STOPS.length - 1; i >= 0; i -= 1) {
    if (count >= COLOR_STOPS[i].min) {
      return COLOR_STOPS[i].color;
    }
  }
  return COLOR_STOPS[0].color;
};

const startOfWeekMonday = (date: Date) => {
  const day = date.getDay();
  const diff = (day + 6) % 7; // shift Sunday to 6
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const QuestionHeatmap: React.FC<Props> = ({ data }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const weeks = useMemo(() => {
    if (!data || data.length === 0) {
      return [] as Array<Array<{ date: string; count: number; isFuture: boolean }>>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map of date -> count for quick lookup
    const activityMap = new Map<string, number>();
    data.forEach((item) => {
      const key = item.date.slice(0, 10);
      activityMap.set(key, (activityMap.get(key) ?? 0) + (item.count || 0));
    });

    // Cover last 52 weeks aligned to Monday start
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 364);
    const start = startOfWeekMonday(oneYearAgo);

    const calendar: Array<Array<{ date: string; count: number; isFuture: boolean }>> = [];

    let cursor = new Date(start);
    for (let week = 0; week < 53; week += 1) {
      const weekRow: Array<{ date: string; count: number; isFuture: boolean }> = [];
      for (let day = 0; day < 7; day += 1) {
        const iso = cursor.toISOString().slice(0, 10);
        const isFuture = cursor > today;
        const count = isFuture ? 0 : activityMap.get(iso) ?? 0;
        weekRow.push({ date: iso, count, isFuture });
        cursor.setDate(cursor.getDate() + 1);
      }
      calendar.push(weekRow);
    }

    return calendar;
  }, [data]);

  const handleWeeksContainerLayout = () => {
    // After layout, scroll to the end to show most recent data (like GitHub)
    if (scrollViewRef.current && weeks.length > 0) {
      // Use a small delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 150);
    }
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No question activity yet</Text>
        <Text style={styles.emptyStateSubtitle}>Solve a question to start your streak.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        <View style={styles.dayLabelColumn}>
          {dayLabels.map((label) => (
            <Text key={label} style={styles.dayLabel}>
              {label}
            </Text>
          ))}
        </View>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View 
            style={styles.weeksContainer}
            onLayout={handleWeeksContainerLayout}
          >
            {weeks.map((week, idx) => (
              <View key={`week-${idx}`} style={styles.weekColumn}>
                {week.map((day) => (
                  <View
                    key={day.date + day.isFuture}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: getColorForCount(day.count),
                        opacity: day.isFuture ? 0.25 : 1,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Less</Text>
        <View style={styles.legendScale}>
          {COLOR_STOPS.map((stop) => (
            <View key={stop.min} style={[styles.legendSwatch, { backgroundColor: stop.color }]} />
          ))}
        </View>
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dayLabelColumn: {
    height: 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP,
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
  scrollContent: {
    paddingRight: spacing.sm,
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: CELL_GAP,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  legendScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  legendLabel: {
    ...typography.caption,
    color: colors.authTextMuted,
    fontWeight: '600',
  },
  emptyState: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.authInputBg,
    borderWidth: 1,
    borderColor: colors.authBorder,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyStateTitle: {
    ...typography.subtitle,
    color: colors.authText,
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    ...typography.caption,
    color: colors.authTextMuted,
  },
});

export default QuestionHeatmap;
