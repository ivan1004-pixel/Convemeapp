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
  dark?: boolean;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
  data,
  predictedValue,
  predictedLabel,
  dark = false,
}) => {
  const allData = predictedValue != null && predictedLabel
    ? [...data, { label: predictedLabel, value: predictedValue }]
    : data;

  if (allData.length === 0) {
      return (
          <View style={{ height: CHART_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'rgba(0,0,0,0.2)', fontWeight: '900' }}>SIN DATOS PARA GRAFICAR</Text>
          </View>
      );
  }

  const values = allData.map((d) => d.value);
  const maxVal = Math.max(...values, 100); // Mínimo 100 para que no se vea vacío
  const minVal = 0; // Empezamos desde 0 siempre para mejor perspectiva
  const range = maxVal - minVal || 1;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const getX = (i: number) =>
    PADDING.left + (allData.length > 1 ? (i / (allData.length - 1)) * innerW : innerW / 2);
  const getY = (val: number) =>
    PADDING.top + innerH - ((val - minVal) / range) * innerH;

  const histPoints = data
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(' ');

  const predX = predictedValue != null ? getX(allData.length - 1) : null;
  const predY = predictedValue != null ? getY(predictedValue) : null;
  const lastHistX = data.length > 0 ? getX(data.length - 1) : null;
  const lastHistY = data.length > 0 ? getY(data[data.length - 1].value) : null;

  // Colores de alta visibilidad
  const axisColor = '#1A1A1A';
  const textColor = '#1A1A1A';
  const lineColor = Colors.primary;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Y-axis */}
      <Line
        x1={PADDING.left}
        y1={PADDING.top}
        x2={PADDING.left}
        y2={CHART_HEIGHT - PADDING.bottom}
        stroke={axisColor}
        strokeWidth={2}
      />
      {/* X-axis */}
      <Line
        x1={PADDING.left}
        y1={CHART_HEIGHT - PADDING.bottom}
        x2={CHART_WIDTH - PADDING.right}
        y2={CHART_HEIGHT - PADDING.bottom}
        stroke={axisColor}
        strokeWidth={2}
      />

      {/* Historical line */}
      {data.length >= 2 && (
        <Polyline
          points={histPoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Dashed line */}
      {predX != null && predY != null && lastHistX != null && lastHistY != null && (
        <Line
          x1={lastHistX}
          y1={lastHistY}
          x2={predX}
          y2={predY}
          stroke={Colors.success}
          strokeWidth={3}
          strokeDasharray="6,4"
          strokeLinecap="round"
        />
      )}

      {/* Circles */}
      {data.map((d, i) => (
        <Circle
          key={i}
          cx={getX(i)}
          cy={getY(d.value)}
          r={5}
          fill={lineColor}
          stroke="#FFF"
          strokeWidth={1}
        />
      ))}

      {/* Prediction point */}
      {predX != null && predY != null && (
        <Circle cx={predX} cy={predY} r={7} fill={Colors.success} stroke="#FFF" strokeWidth={2} />
      )}

      {/* X labels */}
      {allData.map((d, i) => {
        if (allData.length > 6 && i % 2 !== 0 && i !== allData.length - 1) return null;
        return (
          <SvgText
            key={i}
            x={getX(i)}
            y={CHART_HEIGHT - PADDING.bottom + 18}
            fontSize={10}
            fill={textColor}
            textAnchor="middle"
            fontWeight="900"
          >
            {d.label}
          </SvgText>
        );
      })}

      {/* Y labels */}
      <SvgText
        x={PADDING.left - 8}
        y={PADDING.top + 5}
        fontSize={10}
        fill={textColor}
        textAnchor="end"
        fontWeight="900"
      >
        {`$${(maxVal / 1000).toFixed(1)}k`}
      </SvgText>
      <SvgText
        x={PADDING.left - 8}
        y={CHART_HEIGHT - PADDING.bottom}
        fontSize={10}
        fill={textColor}
        textAnchor="end"
        fontWeight="900"
      >
        $0
      </SvgText>
    </Svg>
  );
};

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
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 0,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
