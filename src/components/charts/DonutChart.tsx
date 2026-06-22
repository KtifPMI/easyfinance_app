import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography } from '../../theme';
import { ReportPoint } from '../../types';
import { formatMoney } from '../../utils/format';

export function DonutChart({ data, size = 160, currency = 'RUB', total }: { data: ReportPoint[]; size?: number; currency?: string; total?: number }) {
  const sum = total ?? data.reduce((s, d) => s + d.value, 0);
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
          {data.map((d, i) => {
            const fraction = sum > 0 ? d.value / sum : 0;
            const dash = circumference * fraction;
            const gap = circumference - dash;
            const rotation = -90 + (offsetAcc / sum) * 360;
            offsetAcc += d.value;
            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={d.color || colors.primary}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="butt"
                rotation={rotation}
                origin={`${size / 2}, ${size / 2}`}
              />
            );
          })}
        </Svg>
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Всего</Text>
          <Text style={[typography.h3, { color: colors.text }]}>{formatMoney(sum, currency)}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((d, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color || colors.primary }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={styles.legendValue}>{sum > 0 ? Math.round((d.value / sum) * 100) : 0}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    marginTop: spacing.lg,
    width: '100%',
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  legendLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  legendValue: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
});
