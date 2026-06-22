import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, LoadingState, Screen } from '../../components/common';
import { financeApi } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';

const OPS = ['÷', '×', '−', '+'] as const;

export function InformerScreen() {
  const [rates, setRates] = useState<Awaited<ReturnType<typeof financeApi.getExchangeRates>>>([]);
  const [loading, setLoading] = useState(true);

  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<(typeof OPS)[number] | null>(null);

  useEffect(() => {
    financeApi.getExchangeRates().then((r) => {
      setRates(r);
      setLoading(false);
    });
  }, []);

  const onDigit = (digit: string) => {
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const onOp = (op: (typeof OPS)[number]) => {
    setStored(Number(display));
    setPendingOp(op);
    setDisplay('0');
  };

  const onEquals = () => {
    if (stored === null || !pendingOp) return;
    const current = Number(display);
    let result = current;
    switch (pendingOp) {
      case '+':
        result = stored + current;
        break;
      case '−':
        result = stored - current;
        break;
      case '×':
        result = stored * current;
        break;
      case '÷':
        result = current !== 0 ? stored / current : 0;
        break;
    }
    setDisplay(String(Math.round(result * 100) / 100));
    setStored(null);
    setPendingOp(null);
  };

  const onClear = () => {
    setDisplay('0');
    setStored(null);
    setPendingOp(null);
  };

  if (loading) return <LoadingState />;

  return (
    <Screen>
      <Text style={styles.sectionTitle}>Курсы валют</Text>
      <Card style={styles.section}>
        {rates.map((rate) => (
          <View key={rate.code} style={styles.rateRow}>
            <View style={styles.rateLeft}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyCode}>{rate.code}</Text>
              </View>
              <Text style={styles.rateName}>{rate.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rateValue}>{rate.rate.toFixed(2)} ₽</Text>
              <View style={styles.changeRow}>
                <MaterialCommunityIcons
                  name={rate.change >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={rate.change >= 0 ? colors.income : colors.expense}
                />
                <Text style={[styles.changeText, { color: rate.change >= 0 ? colors.income : colors.expense }]}>
                  {Math.abs(rate.change).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Калькулятор</Text>
      <Card style={styles.section}>
        <Text style={styles.calcDisplay} numberOfLines={1}>
          {display}
        </Text>
        <View style={styles.calcGrid}>
          {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '=', '+'].map((key) => (
            <Pressable
              key={key}
              style={[
                styles.calcButton,
                (OPS as readonly string[]).includes(key) || key === '=' ? styles.calcButtonOp : null,
              ]}
              onPress={() => {
                if (key === '=') onEquals();
                else if ((OPS as readonly string[]).includes(key)) onOp(key as any);
                else if (key === '.') {
                  if (!display.includes('.')) setDisplay(display + '.');
                } else onDigit(key);
              }}
            >
              <Text style={[styles.calcButtonText, (OPS as readonly string[]).includes(key) || key === '=' ? styles.calcButtonTextOp : null]}>
                {key}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearButtonText}>Очистить</Text>
        </Pressable>
      </Card>

      <Text style={styles.sectionTitle}>Финансовый календарь</Text>
      <Card style={styles.section}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.accent} />
          <Text style={styles.infoText}>Налоговый период: уплата НДФЛ до 15 июля</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.accent} />
          <Text style={styles.infoText}>Дата выплаты пособий: 5 число каждого месяца</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currencyBadge: {
    width: 40,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyCode: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  rateName: {
    ...typography.body,
    color: colors.text,
  },
  rateValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    ...typography.small,
  },
  calcDisplay: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  calcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calcButton: {
    width: '25%',
    aspectRatio: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  calcButtonOp: {
    backgroundColor: colors.primaryLight,
  },
  calcButtonText: {
    ...typography.h3,
    color: colors.text,
  },
  calcButtonTextOp: {
    color: colors.primary,
  },
  clearButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  clearButtonText: {
    ...typography.bodyBold,
    color: colors.danger,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});
