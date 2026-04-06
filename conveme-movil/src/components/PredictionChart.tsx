import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;
const CHART_HEIGHT = 180;
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
  const maxVal = Math.max(...values, 100);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const getX = (i: number) =>
    PADDING.left + (allData.length > 1 ? (i / (allData.length - 1)) * innerW : innerW / 2);
  const getY = (val: number) =>
    PADDING.top + innerH - ((val - minVal) / range) * innerH;

  // Creamos el Path para los "Picos" (Área)
  const createPath = (pointsData: DataPoint[]) => {
    if (pointsData.length < 2) return "";
    let d = `M ${getX(0)} ${getY(pointsData[0].value)}`;
    for (let i = 1; i < pointsData.length; i++) {
        d += ` L ${getX(i)} ${getY(pointsData[i].value)}`;
    }
    return d;
  };

  const linePath = createPath(data);
  const areaPath = linePath + ` L ${getX(data.length - 1)} ${CHART_HEIGHT - PADDING.bottom} L ${getX(0)} ${CHART_HEIGHT - PADDING.bottom} Z`;

  const axisColor = '#1A1A1A';
  const textColor = '#1A1A1A';

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.3" />
          <Stop offset="1" stopColor={Colors.primary} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Grid horizontal sutil */}
      {[0, 0.5, 1].map((v, i) => (
          <Line
            key={i}
            x1={PADDING.left}
            y1={getY(maxVal * v)}
            x2={CHART_WIDTH - PADDING.right}
            y2={getY(maxVal * v)}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={1}
          />
      ))}

      {/* Área bajo la curva */}
      {data.length >= 2 && <Path d={areaPath} fill="url(#grad)" />}

      {/* Ejes */}
      <Line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={CHART_HEIGHT - PADDING.bottom} stroke={axisColor} strokeWidth={2} />
      <Line x1={PADDING.left} y1={CHART_HEIGHT - PADDING.bottom} x2={CHART_WIDTH - PADDING.right} y2={CHART_HEIGHT - PADDING.bottom} stroke={axisColor} strokeWidth={2} />

      {/* Línea de Picos Principal */}
      {data.length >= 2 && (
        <Path
          d={linePath}
          fill="none"
          stroke={Colors.primary}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Proyección (Laplace) */}
      {predictedValue != null && data.length > 0 && (
          <Line
            x1={getX(data.length - 1)}
            y1={getY(data[data.length - 1].value)}
            x2={getX(allData.length - 1)}
            y2={getY(predictedValue)}
            stroke={Colors.success}
            strokeWidth={3}
            strokeDasharray="6,4"
          />
      )}

      {/* Puntos de datos */}
      {data.map((d, i) => (
        <Circle key={i} cx={getX(i)} cy={getY(d.value)} r={4} fill={Colors.primary} stroke="#FFF" strokeWidth={1} />
      ))}
      
      {predictedValue != null && (
          <Circle cx={getX(allData.length - 1)} cy={getY(predictedValue)} r={6} fill={Colors.success} stroke="#FFF" strokeWidth={2} />
      )}

      {/* Labels */}
      {allData.map((d, i) => (
        <SvgText key={i} x={getX(i)} y={CHART_HEIGHT - PADDING.bottom + 18} fontSize={9} fill={textColor} textAnchor="middle" fontWeight="900">{d.label}</SvgText>
      ))}

      <SvgText x={PADDING.left - 8} y={PADDING.top + 5} fontSize={9} fill={textColor} textAnchor="end" fontWeight="900">{`$${(maxVal / 1000).toFixed(1)}k`}</SvgText>
      <SvgText x={PADDING.left - 8} y={CHART_HEIGHT - PADDING.bottom} fontSize={9} fill={textColor} textAnchor="end" fontWeight="900">$0</SvgText>
    </Svg>
  );
};

export const PredictionStatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 0 },
  statValue: { fontSize: 15, fontWeight: '900' },
  statLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(0,0,0,0.5)', marginTop: 2, textAlign: 'center', textTransform: 'uppercase' },
});
