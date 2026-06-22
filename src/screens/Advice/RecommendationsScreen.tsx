import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, LoadingState, Screen } from '../../components/common';
import { Gauge } from '../../components/charts/Gauge';
import { financeApi } from '../../services/api';
import { useFinanceStore } from '../../store/financeStore';
import { colors, spacing, typography } from '../../theme';
import { Recommendation } from '../../types';

const SEVERITY_CONFIG = {
  low: { color: colors.success, icon: 'check-circle-outline' as const },
  medium: { color: colors.warning, icon: 'alert-outline' as const },
  high: { color: colors.danger, icon: 'alert-circle' as const },
};

const TYPE_LABEL: Record<Recommendation['type'], string> = {
  tip: 'Совет',
  risk: 'Риск',
  optimization: 'Оптимизация',
};

export function RecommendationsScreen() {
  const { budget } = useFinanceStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getRecommendations().then((r) => {
      setRecommendations(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  // Simple financial health score based on budget usage
  const expensePercent = budget && budget.plannedExpense > 0 ? (budget.actualExpense / budget.plannedExpense) * 100 : 0;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - Math.max(expensePercent - 50, 0))));

  return (
    <Screen>
      <Card style={styles.scoreCard}>
        <Gauge percent={healthScore} label="индекс здоровья" />
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={styles.scoreTitle}>Финансовое состояние</Text>
          <Text style={styles.scoreText}>
            {healthScore >= 70
              ? 'Ваши финансы в хорошем состоянии. Продолжайте следовать плану.'
              : healthScore >= 40
              ? 'Есть зоны для улучшения — посмотрите рекомендации ниже.'
              : 'Расходы значительно превышают план. Рекомендуем пересмотреть бюджет.'}
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Рекомендации</Text>
      {recommendations.length === 0 ? (
        <EmptyState icon="lightbulb-outline" title="Пока нет рекомендаций" />
      ) : (
        recommendations.map((rec) => {
          const config = SEVERITY_CONFIG[rec.severity];
          return (
            <Card key={rec.id} style={styles.card}>
              <View style={styles.row}>
                <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <View style={styles.headerRow}>
                    <Text style={styles.cardTitle}>{rec.title}</Text>
                    <View style={[styles.tag, { backgroundColor: config.color + '22' }]}>
                      <Text style={[styles.tagText, { color: config.color }]}>{TYPE_LABEL[rec.type]}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDescription}>{rec.description}</Text>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  scoreText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    ...typography.small,
    fontWeight: '700',
  },
});
