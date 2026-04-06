import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 220;
const PADDING_BOTTOM = 40;
const PADDING_LEFT = 50;
const BAR_GAP = 15;
const MIN_BAR_WIDTH = 45;

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, color = Colors.primary }) => {
  if (!data || data.length === 0) return null;

  // Calculamos el ancho dinámico basado en la cantidad de vendedores
  const dynamicWidth = Math.max(SCREEN_WIDTH - 60, data.length * (MIN_BAR_WIDTH + BAR_GAP) + PADDING_LEFT + 20);
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const usableHeight = CHART_HEIGHT - PADDING_BOTTOM - 30;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <Svg width={dynamicWidth} height={CHART_HEIGHT}>
        {/* Ejes */}
        <Line
          x1={PADDING_LEFT}
          y1={10}
          x2={PADDING_LEFT}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke={Colors.dark}
          strokeWidth={2}
        />
        <Line
          x1={PADDING_LEFT}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={dynamicWidth - 10}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke={Colors.dark}
          strokeWidth={2}
        />

        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * usableHeight;
          const x = PADDING_LEFT + i * (MIN_BAR_WIDTH + BAR_GAP) + BAR_GAP;
          const y = CHART_HEIGHT - PADDING_BOTTOM - barHeight;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={MIN_BAR_WIDTH}
                height={barHeight}
                fill={color}
                stroke={Colors.dark}
                strokeWidth={2}
              />
              <SvgText
                x={x + MIN_BAR_WIDTH / 2}
                y={CHART_HEIGHT - PADDING_BOTTOM + 18}
                fontSize={9}
                fill={Colors.dark}
                textAnchor="middle"
                fontWeight="900"
              >
                {d.label}
              </SvgText>
              <SvgText
                x={x + MIN_BAR_WIDTH / 2}
                y={y - 8}
                fontSize={9}
                fill={Colors.dark}
                textAnchor="middle"
                fontWeight="800"
              >
                {d.value > 999 ? `$${(d.value/1000).toFixed(1)}k` : `$${d.value}`}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    marginVertical: Spacing.md,
  },
});
