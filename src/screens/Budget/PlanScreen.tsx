import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, LoadingState, Screen } from '../../components/common';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Gauge } from '../../components/charts/Gauge';
import { PlanStackParamList } from '../../navigation/types';
import { useFinanceStore } from '../../store/financeStore';
import { colors, spacing, typography } from '../../theme';
import { formatMoney } from '../../utils/format';

type Nav = NativeStackNavigationProp<PlanStackParamList>;

export function PlanScreen() {
  const navigation = useNavigation<Nav>();
  const { budget, categories, goals, isLoading, loaded, loadAll } = useFinanceStore();

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded]);

  if (isLoading && !loaded) return <LoadingState />;
  if (!budget) return <LoadingState />;

  const expensePercent = budget.plannedExpense > 0 ? (budget.actualExpense / budget.plannedExpense) * 100 : 0;
  const incomePercent = budget.plannedIncome > 0 ? (budget.actualIncome / budget.plannedIncome) * 100 : 0;
  const remaining = budget.plannedExpense - budget.actualExpense;

  // simple forecast: average daily spend * days remaining in month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const dailyAvg = budget.actualExpense / Math.max(dayOfMonth, 1);
  const projectedExpense = dailyAvg * daysInMonth;
  const projectedRemaining = budget.plannedIncome - projectedExpense;

  return (
    <Screen>
      <Text style={styles.title}>Бюджет на {monthName(now)}</Text>

      <Card style={styles.gaugeCard}>
        <Gauge percent={expensePercent} label="расходов плана" sublabel={formatMoney(budget.actualExpense)} />
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={styles.gaugeLine}>
            План расходов: <Text style={styles.gaugeValue}>{formatMoney(budget.plannedExpense)}</Text>
          </Text>
          <Text style={styles.gaugeLine}>
            Остаток: <Text style={[styles.gaugeValue, remaining < 0 && { color: colors.danger }]}>{formatMoney(remaining)}</Text>
          </Text>
          <Text style={styles.gaugeLine}>
            Доход: <Text style={styles.gaugeValue}>{formatMoney(budget.actualIncome)}</Text> / {formatMoney(budget.plannedIncome)}
          </Text>
          {expensePercent >= 100 ? (
            <View style={styles.warningBadge}>
              <MaterialCommunityIcons name="alert" size={14} color={colors.danger} />
              <Text style={styles.warningBadgeText}>Перерасход бюджета</Text>
            </View>
          ) : expensePercent >= 80 ? (
            <View style={[styles.warningBadge, { backgroundColor: colors.warning + '22' }]}>
              <MaterialCommunityIcons name="alert-outline" size={14} color={colors.warning} />
              <Text style={[styles.warningBadgeText, { color: colors.warning }]}>Близко к лимиту</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Прогноз на конец месяца</Text>
        <Text style={styles.forecastText}>
          При текущем темпе трат расходы составят примерно{' '}
          <Text style={styles.gaugeValue}>{formatMoney(projectedExpense)}</Text>.
        </Text>
        <Text style={styles.forecastText}>
          Прогнозируемый остаток к концу месяца:{' '}
          <Text style={[styles.gaugeValue, projectedRemaining < 0 && { color: colors.danger }]}>{formatMoney(projectedRemaining)}</Text>
        </Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>По категориям</Text>
        {/* Заголовок таблицы */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCol, { flex: 2 }]}>Категория</Text>
          <Text style={[styles.tableCol, styles.tableColRight]}>Факт</Text>
          <Text style={[styles.tableCol, styles.tableColRight]}>План</Text>
          <Text style={[styles.tableCol, styles.tableColRight]}>Разница</Text>
        </View>
        {budget.categories.map((bc) => {
          const cat = categories.find((c) => c.id === bc.categoryId);
          if (!cat) return null;
          const diff = bc.planned - bc.spent;
          const percent = bc.planned > 0 ? (bc.spent / bc.planned) * 100 : 0;
          const isOver = diff < 0;
          return (
            <View key={bc.categoryId} style={styles.catRow}>
              <View style={styles.catHeader}>
                <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={14} color={cat.color} />
                </View>
                <Text style={[styles.catName, { flex: 2 }]} numberOfLines={1}>{cat.name}</Text>
                <Text style={[styles.tableCol, styles.tableColRight, styles.catAmountText]}>{formatMoney(bc.spent)}</Text>
                <Text style={[styles.tableCol, styles.tableColRight, styles.catAmountText]}>{formatMoney(bc.planned)}</Text>
                <Text style={[styles.tableCol, styles.tableColRight, styles.catAmountText, { color: isOver ? colors.expense : colors.income }]}>
                  {isOver ? '-' : '+'}{formatMoney(Math.abs(diff))}
                </Text>
              </View>
              <ProgressBar percent={percent} color={isOver ? colors.expense : cat.color} />
            </View>
          );
        })}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Финансовые цели</Text>
          <Pressable onPress={() => navigation.navigate('AddGoal')}>
            <Text style={styles.link}>+ Добавить</Text>
          </Pressable>
        </View>
        {goals.map((goal) => {
          const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          return (
            <Pressable key={goal.id} style={styles.goalRow} onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}>
              <View style={[styles.catIcon, { backgroundColor: goal.color + '22' }]}>
                <MaterialCommunityIcons name={goal.icon as any} size={18} color={goal.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>{goal.title}</Text>
                <ProgressBar percent={percent} color={goal.color} height={6} />
              </View>
              <Text style={styles.goalPercent}>{Math.round(percent)}%</Text>
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

function monthName(date: Date) {
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  gaugeCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  gaugeValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    gap: 4,
  },
  warningBadgeText: {
    ...typography.small,
    color: colors.danger,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
  },
  forecastText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  catRow: {
    marginBottom: spacing.md,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  catIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  catName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  catAmounts: {
    ...typography.small,
    color: colors.textSecondary,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  tableCol: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  tableColRight: {
    textAlign: 'right',
  },
  catAmountText: {
    ...typography.small,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  goalPercent: {
    ...typography.bodyBold,
    color: colors.text,
  },
});
