import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import { colors, spacing, typography } from '../../theme';

interface LineChartProps {
  data: number[];
  labels: string[];
  title?: string;
  yAxisSuffix?: string;
  color?: string;
  height?: number;
}

const screenWidth = Dimensions.get('window').width;

export default function LineChart({
  data,
  labels,
  title,
  yAxisSuffix = '',
  color = colors.primary,
  height = 220,
}: LineChartProps) {
  // Force 0-100 scale for percentage charts
  const isPercentage = yAxisSuffix === '%';
  
  // Ensure data doesn't exceed 100 for percentage charts
  const normalizedData = isPercentage 
    ? data.map(val => Math.min(100, Math.max(0, val)))
    : data;

  // Only use actual data - no fake 0/100 points
  const chartData = {
    labels: labels.length > 0 ? labels : [''],
    datasets: [
      {
        data: normalizedData.length > 0 ? normalizedData : [0],
        color: (opacity = 1) => color,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.authSurface,
    backgroundGradientFrom: colors.authSurface,
    backgroundGradientTo: colors.authSurface,
    decimalPlaces: isPercentage ? 0 : 1,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: color,
      fill: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.authBorder,
      strokeWidth: 1,
    },
  };

  // Calculate chart width to fit within container, accounting for Y-axis labels
  // Add extra space for longer suffixes
  const suffixLength = yAxisSuffix.length;
  const yAxisPadding = suffixLength > 3 ? 55 : 45; // More padding for longer suffixes
  const chartWidth = screenWidth - spacing.xxl * 2 - spacing.md * 4 - yAxisPadding;

  // Use shorter suffix for display if it's too long to prevent truncation
  // Map common long suffixes to shorter versions
  const suffixMap: Record<string, string> = {
    ' questions': ' Q',
    ' question': ' Q',
    ' attempts': ' A',
    ' attempt': ' A',
  };
  const displaySuffix = suffixMap[yAxisSuffix] || (suffixLength > 8 ? yAxisSuffix.substring(0, 8) : yAxisSuffix);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          <RNLineChart
            data={chartData}
            width={chartWidth}
            height={height}
            yAxisSuffix={displaySuffix}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            segments={isPercentage ? 5 : 4}
            yLabelsOffset={15}
            xLabelsOffset={-5}
            yAxisLabel=""
            xAxisLabel=""
            fromZero={!isPercentage}
          />
        </View>
        {/* Show full label below chart if suffix was shortened */}
        {(suffixMap[yAxisSuffix] || suffixLength > 8) && (
          <Text style={styles.suffixLabel}>Y-axis: {yAxisSuffix.trim()}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.authText,
    fontWeight: '700',
    marginBottom: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
  },
  chartWrapper: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  chartContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    marginLeft: -spacing.sm,
  },
  suffixLabel: {
    ...typography.caption,
    color: colors.authTextMuted || '#6B7280',
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

