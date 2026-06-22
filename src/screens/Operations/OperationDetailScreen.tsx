import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Screen } from '../../components/common';
import { OperationsStackParamList } from '../../navigation/types';
import { useFinanceStore } from '../../store/financeStore';
import { colors, spacing, typography } from '../../theme';
import { formatDateLong, formatMoney } from '../../utils/format';

type Nav = NativeStackNavigationProp<OperationsStackParamList>;
type RouteProps = { params: { operationId: string } };

export function OperationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute() as unknown as RouteProps;
  const { operations, accounts, categories, tags, deleteOperation } = useFinanceStore();

  const operation = operations.find((o) => o.id === route.params.operationId);

  if (!operation) {
    return (
      <Screen>
        <Text style={styles.notFound}>Операция не найдена</Text>
      </Screen>
    );
  }

  const account = accounts.find((a) => a.id === operation.accountId);
  const toAccount = accounts.find((a) => a.id === operation.toAccountId);
  const category = categories.find((c) => c.id === operation.categoryId);
  const opTags = tags.filter((t) => operation.tagIds?.includes(t.id));

  const onDelete = () => {
    Alert.alert('Удалить операцию?', 'Операция будет перемещена в корзину', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await deleteOperation(operation.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const amountColor =
    operation.type === 'income' ? colors.income : operation.type === 'expense' ? colors.expense : colors.transfer;
  const amountPrefix = operation.type === 'income' ? '+' : operation.type === 'expense' ? '-' : '';

  return (
    <Screen>
      <Card style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        {category ? (
          <View style={[styles.bigIcon, { backgroundColor: category.color + '22' }]}>
            <MaterialCommunityIcons name={category.icon as any} size={32} color={category.color} />
          </View>
        ) : (
          <View style={[styles.bigIcon, { backgroundColor: colors.transfer + '22' }]}>
            <MaterialCommunityIcons name="swap-horizontal" size={32} color={colors.transfer} />
          </View>
        )}
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}
          {formatMoney(operation.amount, operation.currency)}
        </Text>
        <Text style={styles.date}>{formatDateLong(operation.date)}</Text>
      </Card>

      <Card>
        <Row label="Тип" value={typeLabel(operation.type)} />
        {category ? <Row label="Категория" value={category.name} /> : null}
        <Row label="Счёт" value={account?.name || '—'} />
        {toAccount ? <Row label="Счёт зачисления" value={toAccount.name} /> : null}
        {operation.comment ? <Row label="Комментарий" value={operation.comment} /> : null}
        {opTags.length > 0 ? <Row label="Метки" value={opTags.map((t) => t.name).join(', ')} /> : null}
      </Card>

      <Button title="Удалить операцию" variant="outline" onPress={onDelete} style={{ marginTop: spacing.lg, borderColor: colors.danger }} />
    </Screen>
  );
}

function typeLabel(type: string) {
  if (type === 'expense') return 'Расход';
  if (type === 'income') return 'Доход';
  return 'Перевод';
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
  bigIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  amount: {
    ...typography.h1,
  },
  date: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    flexShrink: 1,
    textAlign: 'right',
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
