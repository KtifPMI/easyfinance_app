import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { ReportPoint } from '../../types';
import { formatMoney } from '../../utils/format';

export function BarChart({ data, currency = 'RUB' }: { data: ReportPoint[]; currency?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      {data.map((point, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {point.label}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max((point.value / max) * 100, 3)}%`,
                  backgroundColor: point.color || colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{formatMoney(point.value, currency)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.text,
    width: 110,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  value: {
    ...typography.small,
    color: colors.textSecondary,
    width: 80,
    textAlign: 'right',
  },
});
