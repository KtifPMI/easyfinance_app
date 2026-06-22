import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common';
import { colors, spacing, typography } from '../../theme';
import { FinHealthIndicators } from '../../utils/calc';

interface IndicatorConfig {
  key: keyof FinHealthIndicators;
  label: string;
  icon: string;
  goodThreshold: number; // % above which it's "good"
}

const INDICATORS: IndicatorConfig[] = [
  { key: 'finState', label: 'Состояние', icon: 'heart-pulse', goodThreshold: 60 },
  { key: 'money',    label: 'Ликвидность', icon: 'water',     goodThreshold: 50 },
  { key: 'budget',   label: 'Бюджет',    icon: 'chart-bar',  goodThreshold: 50 },
  { key: 'debt',     label: 'Долги',     icon: 'bank',       goodThreshold: 70 },
  { key: 'savings',  label: 'Сбережения', icon: 'piggy-bank', goodThreshold: 40 },
];

function indicatorColor(value: number, threshold: number) {
  if (value >= threshold) return colors.income;
  if (value >= threshold * 0.5) return colors.warning;
  return colors.expense;
}

interface Props {
  indicators: FinHealthIndicators;
}

export function FinHealthCard({ indicators }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Финансовое состояние</Text>
      <View style={styles.row}>
        {INDICATORS.map((ind) => {
          const value = indicators[ind.key];
          const color = indicatorColor(value, ind.goodThreshold);
          return (
            <View key={ind.key} style={styles.item}>
              <View style={[styles.arc, { borderColor: color }]}>
                <MaterialCommunityIcons name={ind.icon as any} size={18} color={color} />
                <Text style={[styles.percent, { color }]}>{value}%</Text>
              </View>
              <Text style={styles.label} numberOfLines={1}>{ind.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>Ликвидность: запас на 3 мес. · Сбережения: норма 20% дохода</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  arc: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  percent: {
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hint: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
