import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input, Screen } from '../../components/common';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useFinanceStore } from '../../store/financeStore';
import { colors, spacing, typography } from '../../theme';
import { formatDateLong, formatMoney } from '../../utils/format';

type RouteProps = { params: { goalId: string } };

export function GoalDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute() as unknown as RouteProps;
  const { goals, updateGoal } = useFinanceStore();
  const [topUp, setTopUp] = useState('');
  const [saving, setSaving] = useState(false);

  const goal = goals.find((g) => g.id === route.params.goalId);

  if (!goal) {
    return (
      <Screen>
        <Text style={styles.notFound}>Цель не найдена</Text>
      </Screen>
    );
  }

  const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthsLeft = Math.max(0, monthsBetween(new Date(), new Date(goal.deadline)));
  const recommendation = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;

  // "Накоплю к дате" — когда достигну цели при текущем темпе накоплений
  const monthly = goal.monthlyRecommendation || recommendation;
  const monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const willReachDate = monthsNeeded != null
    ? (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + monthsNeeded);
        return d;
      })()
    : null;

  const onTopUp = async () => {
    const value = Number(topUp);
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      await updateGoal(goal.id, { currentAmount: Math.min(goal.currentAmount + value, goal.targetAmount) });
      setTopUp('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card style={styles.headerCard}>
        <View style={[styles.icon, { backgroundColor: goal.color + '22' }]}>
          <MaterialCommunityIcons name={goal.icon as any} size={32} color={goal.color} />
        </View>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.amount}>
          {formatMoney(goal.currentAmount)} <Text style={styles.amountTotal}>из {formatMoney(goal.targetAmount)}</Text>
        </Text>
        <ProgressBar percent={percent} color={goal.color} height={10} />
        <Text style={styles.percent}>{Math.round(percent)}% накоплено</Text>
      </Card>

      <Card style={styles.section}>
        <Row label="Срок достижения" value={formatDateLong(goal.deadline)} />
        <Row label="Осталось накопить" value={formatMoney(remaining)} />
        <Row label="Осталось месяцев" value={`${monthsLeft}`} />
        {willReachDate && remaining > 0 ? (
          <Row
            label="Накоплю к дате"
            value={willReachDate <= new Date(goal.deadline)
              ? `~${formatDateLong(willReachDate.toISOString())}`
              : `Позже срока (~${formatDateLong(willReachDate.toISOString())})`}
          />
        ) : null}
        {monthly > 0 && remaining > 0 ? (
          <Row label="Откладывать в месяц" value={formatMoney(monthly)} />
        ) : null}
      </Card>

      {percent < 100 ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Рекомендация по накоплению</Text>
          <Text style={styles.recText}>
            Чтобы успеть к сроку, откладывайте примерно{' '}
            <Text style={styles.recValue}>{formatMoney(recommendation)}</Text> в месяц.
          </Text>
        </Card>
      ) : (
        <Card style={styles.section}>
          <View style={styles.achievement}>
            <MaterialCommunityIcons name="trophy" size={28} color="#F59E0B" />
            <Text style={styles.achievementText}>Цель достигнута! Поздравляем 🎉</Text>
          </View>
        </Card>
      )}

      {percent < 100 ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Пополнить цель</Text>
          <Input
            placeholder="Сумма пополнения"
            keyboardType="number-pad"
            value={topUp}
            onChangeText={(v) => setTopUp(v.replace(/[^0-9]/g, ''))}
          />
          <Button title="Пополнить" onPress={onTopUp} loading={saving} disabled={!Number(topUp)} />
        </Card>
      ) : null}
    </Screen>
  );
}

function monthsBetween(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  amount: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  amountTotal: {
    ...typography.body,
    color: colors.textSecondary,
  },
  percent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  recText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  recValue: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  achievementText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
