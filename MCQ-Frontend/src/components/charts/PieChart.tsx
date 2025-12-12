import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { colors, spacing, typography } from '../../theme';

interface PieChartData {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
}

const screenWidth = Dimensions.get('window').width;

export default function PieChart({
  data,
  title,
  height = 220,
}: PieChartProps) {
  const chartConfig = {
    backgroundColor: colors.authSurface,
    backgroundGradientFrom: colors.authSurface,
    backgroundGradientTo: colors.authSurface,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNPieChart
        data={data}
        width={screenWidth - spacing.xxl * 2}
        height={height}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.authTextMuted,
  },
});





