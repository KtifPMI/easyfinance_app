import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, LoadingState, Screen } from '../../components/common';
import { Chip } from '../../components/common/Chip';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { useFinanceStore } from '../../store/financeStore';
import { colors, spacing, typography } from '../../theme';
import { ReportPeriod } from '../../types';
import { formatMoney } from '../../utils/format';

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'День' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'quarter', label: '3 месяца' },
  { key: 'year', label: '12 месяцев' },
];

function getPeriodRange(period: ReportPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
  }
  return { start, end };
}

export function ReportsScreen() {
  const { operations, categories, accounts, tags, isLoading, loaded, loadAll } = useFinanceStore();
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [tab, setTab] = useState<'expense' | 'income' | 'capital'>('expense');

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded]);

  if (isLoading && !loaded) return <LoadingState />;

  const { start, end } = getPeriodRange(period);
  const filtered = operations.filter((o) => !o.isDeleted && new Date(o.date) >= start && new Date(o.date) <= end);

  const expenseOps = filtered.filter((o) => o.type === 'expense');
  const incomeOps = filtered.filter((o) => o.type === 'income');

  const byCategory = (ops: typeof operations) => {
    const map = new Map<string, number>();
    ops.forEach((o) => {
      const key = o.categoryId || 'unknown';
      map.set(key, (map.get(key) || 0) + o.amount);
    });
    return Array.from(map.entries())
      .map(([categoryId, value]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return { label: cat?.name || 'Без категории', value, color: cat?.color || colors.textSecondary };
      })
      .sort((a, b) => b.value - a.value);
  };

  const byTag = (ops: typeof operations) => {
    const map = new Map<string, number>();
    ops.forEach((o) => {
      (o.tagIds || ['none']).forEach((tagId) => {
        map.set(tagId, (map.get(tagId) || 0) + o.amount);
      });
    });
    return Array.from(map.entries())
      .map(([tagId, value]) => {
        const tag = tags.find((t) => t.id === tagId);
        return { label: tag?.name || 'Без метки', value, color: colors.accent };
      })
      .sort((a, b) => b.value - a.value);
  };

  const expenseByCategory = useMemo(() => byCategory(expenseOps), [expenseOps, categories]);
  const incomeByCategory = useMemo(() => byCategory(incomeOps), [incomeOps, categories]);
  const expenseByTag = useMemo(() => byTag(expenseOps), [expenseOps, tags]);

  const totalExpense = expenseOps.reduce((s, o) => s + o.amount, 0);
  const totalIncome = incomeOps.reduce((s, o) => s + o.amount, 0);
  const totalCapital = accounts.reduce((s, a) => s + a.balance, 0);

  const accountsData = accounts.map((a) => ({ label: a.name, value: a.balance, color: a.color }));

  return (
    <Screen>
      <Text style={styles.title}>Отчёты</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onPress={() => setPeriod(p.key)} />
        ))}
      </ScrollView>

      <View style={styles.tabRow}>
        {(['expense', 'income', 'capital'] as const).map((t) => (
          <Chip
            key={t}
            label={t === 'expense' ? 'Расходы' : t === 'income' ? 'Доходы' : 'Капитал'}
            active={tab === t}
            onPress={() => setTab(t)}
          />
        ))}
      </View>

      {tab === 'expense' ? (
        <>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Расходы по категориям</Text>
            {expenseByCategory.length > 0 ? (
              <DonutChart data={expenseByCategory} total={totalExpense} />
            ) : (
              <Text style={styles.emptyText}>Нет данных за выбранный период</Text>
            )}
          </Card>

          {expenseByTag.length > 0 ? (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Расходы по меткам</Text>
              <BarChart data={expenseByTag} />
            </Card>
          ) : null}
        </>
      ) : null}

      {tab === 'income' ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Доходы по категориям</Text>
          {incomeByCategory.length > 0 ? (
            <DonutChart data={incomeByCategory} total={totalIncome} />
          ) : (
            <Text style={styles.emptyText}>Нет данных за выбранный период</Text>
          )}
        </Card>
      ) : null}

      {tab === 'capital' ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Капитал по счетам</Text>
          <Text style={styles.totalCapital}>{formatMoney(totalCapital)}</Text>
          <BarChart data={accountsData} />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Сводка за период</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Доходы</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>{formatMoney(totalIncome)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Расходы</Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]}>{formatMoney(totalExpense)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Баланс</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalIncome - totalExpense)}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  periodRow: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  totalCapital: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
});
