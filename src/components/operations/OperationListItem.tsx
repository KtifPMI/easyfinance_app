import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Account, Category, Operation } from '../../types';
import { formatMoney } from '../../utils/format';

export function OperationListItem({
  operation,
  category,
  account,
  toAccount,
  onPress,
}: {
  operation: Operation;
  category?: Category;
  account?: Account;
  toAccount?: Account;
  onPress: () => void;
}) {
  const isExpense = operation.type === 'expense';
  const isIncome = operation.type === 'income';
  const isTransfer = operation.type === 'transfer';

  const icon = isTransfer ? 'swap-horizontal' : (category?.icon as any) || 'help-circle-outline';
  const color = isTransfer ? colors.transfer : category?.color || colors.textSecondary;

  const title = isTransfer
    ? `${account?.name || ''} → ${toAccount?.name || ''}`
    : category?.name || (isExpense ? 'Без категории' : 'Без категории');

  const amountColor = isIncome ? colors.income : isTransfer ? colors.transfer : colors.text;
  const amountPrefix = isIncome ? '+' : isExpense ? '-' : '';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {operation.comment || account?.name || ''}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix}
        {formatMoney(operation.amount, operation.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    ...typography.bodyBold,
  },
});
