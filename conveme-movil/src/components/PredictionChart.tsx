import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;
const CHART_HEIGHT = 160;
const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

interface DataPoint {
  label: string;
  value: number;
}

interface PredictionChartProps {
  data: DataPoint[];
  predictedValue?: number;
  predictedLabel?: string;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
  data,
  predictedValue,
  predictedLabel,
}) => {
  const allData = predictedValue != null && predictedLabel
    ? [...data, { label: predictedLabel, value: predictedValue }]
    : data;

  if (allData.length === 0) return null;

  const values = allData.map((d) => d.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const getX = (i: number) =>
    PADDING.left + (i / (allData.length - 1)) * innerW;
  const getY = (val: number) =>
    PADDING.top + innerH - ((val - minVal) / range) * innerH;

  // Build polyline points string for historical data
  const histPoints = data
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(' ');

  // Prediction point
  const predX = predictedValue != null ? getX(allData.length - 1) : null;
  const predY = predictedValue != null ? getY(predictedValue) : null;
  const lastHistX = data.length > 0 ? getX(data.length - 1) : null;
  const lastHistY = data.length > 0 ? getY(data[data.length - 1].value) : null;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Y-axis */}
      <Line
        x1={PADDING.left}
        y1={PADDING.top}
        x2={PADDING.left}
        y2={CHART_HEIGHT - PADDING.bottom}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
      {/* X-axis */}
      <Line
        x1={PADDING.left}
        y1={CHART_HEIGHT - PADDING.bottom}
        x2={CHART_WIDTH - PADDING.right}
        y2={CHART_HEIGHT - PADDING.bottom}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />

      {/* Historical line */}
      {data.length >= 2 && (
        <Polyline
          points={histPoints}
          fill="none"
          stroke={Colors.info}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Dashed line from last historical to prediction */}
      {predX != null && predY != null && lastHistX != null && lastHistY != null && (
        <Line
          x1={lastHistX}
          y1={lastHistY}
          x2={predX}
          y2={predY}
          stroke={Colors.success}
          strokeWidth={2.5}
          strokeDasharray="6,4"
          strokeLinecap="round"
        />
      )}

      {/* Data point circles */}
      {data.map((d, i) => (
        <Circle
          key={i}
          cx={getX(i)}
          cy={getY(d.value)}
          r={4}
          fill={Colors.info}
        />
      ))}

      {/* Prediction point */}
      {predX != null && predY != null && (
        <Circle cx={predX} cy={predY} r={6} fill={Colors.success} />
      )}

      {/* X-axis labels */}
      {allData.map((d, i) => {
        if (allData.length > 6 && i % 2 !== 0 && i !== allData.length - 1) return null;
        return (
          <SvgText
            key={i}
            x={getX(i)}
            y={CHART_HEIGHT - PADDING.bottom + 16}
            fontSize={9}
            fill="rgba(255,255,255,0.6)"
            textAnchor="middle"
          >
            {d.label.length > 6 ? d.label.slice(-4) : d.label}
          </SvgText>
        );
      })}

      {/* Y-axis label (max) */}
      <SvgText
        x={PADDING.left - 6}
        y={PADDING.top + 5}
        fontSize={9}
        fill="rgba(255,255,255,0.6)"
        textAnchor="end"
      >
        {`$${(maxVal / 1000).toFixed(0)}k`}
      </SvgText>
    </Svg>
  );
};

// Stat card for prediction values
interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

export const PredictionStatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statValue: {
    ...Typography.h4,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    textAlign: 'center',
  },
});
