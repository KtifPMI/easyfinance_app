import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../components/common/Chip';
import { EmptyState, LoadingState } from '../../components/common';
import { OperationListItem } from '../../components/operations/OperationListItem';
import { OperationsStackParamList, RootStackParamList } from '../../navigation/types';
import { useFinanceStore } from '../../store/financeStore';
import { colors, radius, spacing, typography } from '../../theme';
import { OperationType } from '../../types';
import { groupByDay, formatDayLabel, formatMoney, formatSignedMoney } from '../../utils/format';
import { getTotalBalance } from '../../utils/calc';

type Nav = NativeStackNavigationProp<OperationsStackParamList & RootStackParamList>;

const TYPE_LABELS: Record<OperationType | 'all', string> = {
  all: 'Все',
  expense: 'Расходы',
  income: 'Доходы',
  transfer: 'Переводы',
};

export function OperationsListScreen() {
  const navigation = useNavigation<Nav>();
  const { operations, accounts, categories, isLoading, loaded, loadAll } = useFinanceStore();

  const [typeFilter, setTypeFilter] = useState<OperationType | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded]);

  const filtered = useMemo(() => {
    return operations
      .filter((o) => !o.isDeleted)
      .filter((o) => typeFilter === 'all' || o.type === typeFilter)
      .filter((o) => accountFilter === 'all' || o.accountId === accountFilter || o.toAccountId === accountFilter)
      .filter((o) => categoryFilter === 'all' || o.categoryId === categoryFilter)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [operations, typeFilter, accountFilter, categoryFilter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const accountById = (id: string) => accounts.find((a) => a.id === id);
  const categoryById = (id?: string) => categories.find((c) => c.id === id);

  const activeCategory = categoryById(categoryFilter !== 'all' ? categoryFilter : undefined);

  // Сводка "Было / Изменение / Стало" как в EasyFinance
  const filteredIncome = filtered.reduce((s, o) => o.type === 'income' ? s + o.amount : s, 0);
  const filteredExpense = filtered.reduce((s, o) => o.type === 'expense' ? s + o.amount : s, 0);
  const change = filteredIncome - filteredExpense;
  const currentTotal = getTotalBalance(accounts);
  const wasTotal = currentTotal - change;

  if (isLoading && !loaded) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Операции</Text>
        <Pressable onPress={() => navigation.navigate('Trash')}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
        {(['all', 'expense', 'income', 'transfer'] as const).map((type) => (
          <Chip key={type} label={TYPE_LABELS[type]} active={typeFilter === type} onPress={() => setTypeFilter(type)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
        <Chip label="Все счета" active={accountFilter === 'all'} onPress={() => setAccountFilter('all')} />
        {accounts.map((a) => (
          <Chip key={a.id} label={a.name} active={accountFilter === a.id} onPress={() => setAccountFilter(a.id)} />
        ))}
        <Chip
          label={activeCategory ? activeCategory.name : 'Категория'}
          active={categoryFilter !== 'all'}
          onPress={() => setCategoryModalVisible(true)}
        />
      </ScrollView>

      {filtered.length > 0 && (
        <View style={styles.periodSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Было</Text>
            <Text style={styles.summaryValue}>{formatMoney(wasTotal)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Изменение</Text>
            <Text style={[styles.summaryValue, { color: change >= 0 ? colors.income : colors.expense }]}>
              {formatSignedMoney(change)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Стало</Text>
            <Text style={styles.summaryValue}>{formatMoney(currentTotal)}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={groups}
        keyExtractor={(g) => g.date}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAll} colors={[colors.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="format-list-bulleted"
            title="Операций пока нет"
            subtitle="Добавьте первую операцию, чтобы начать учёт"
            actionLabel="Добавить операцию"
            onAction={() => navigation.navigate('AddOperation', undefined)}
          />
        }
        renderItem={({ item: group }) => {
          const dayIncome = group.items.filter((o) => o.type === 'income').reduce((s, o) => s + o.amount, 0);
          const dayExpense = group.items.filter((o) => o.type === 'expense').reduce((s, o) => s + o.amount, 0);
          return (
            <View style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{formatDayLabel(group.items[0].date)}</Text>
                <Text style={styles.groupSummary}>
                  {dayIncome > 0 ? `+${formatMoney(dayIncome)}  ` : ''}
                  {dayExpense > 0 ? `-${formatMoney(dayExpense)}` : ''}
                </Text>
              </View>
              {group.items.map((op) => (
                <OperationListItem
                  key={op.id}
                  operation={op}
                  category={categoryById(op.categoryId)}
                  account={accountById(op.accountId)}
                  toAccount={op.toAccountId ? accountById(op.toAccountId) : undefined}
                  onPress={() => navigation.navigate('OperationDetail', { operationId: op.id })}
                />
              ))}
            </View>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddOperation', undefined)}>
        <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
      </Pressable>

      <Modal visible={categoryModalVisible} animationType="slide" transparent onRequestClose={() => setCategoryModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Категория</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Pressable
                style={styles.modalRow}
                onPress={() => {
                  setCategoryFilter('all');
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={styles.modalRowText}>Все категории</Text>
              </Pressable>
              {categories.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.modalRow}
                  onPress={() => {
                    setCategoryFilter(c.id);
                    setCategoryModalVisible(false);
                  }}
                >
                  <View style={[styles.modalIcon, { backgroundColor: c.color + '22' }]}>
                    <MaterialCommunityIcons name={c.icon as any} size={18} color={c.color} />
                  </View>
                  <Text style={styles.modalRowText}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  filtersRow: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  group: {
    marginBottom: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  groupTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  groupSummary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  modalRowText: {
    ...typography.body,
    color: colors.text,
  },
  periodSummary: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 13,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});
