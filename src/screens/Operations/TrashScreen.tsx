import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, LoadingState, Screen } from '../../components/common';
import { OperationListItem } from '../../components/operations/OperationListItem';
import { financeApi } from '../../services/api';
import { useFinanceStore } from '../../store/financeStore';
import { colors, spacing, typography } from '../../theme';
import { Operation } from '../../types';

export function TrashScreen() {
  const { accounts, categories, refresh } = useFinanceStore();
  const [deleted, setDeleted] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDeletedOperations();
      setDeleted(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRestore = async (id: string) => {
    await financeApi.restoreOperation(id);
    await Promise.all([load(), refresh()]);
  };

  if (loading) return <LoadingState />;

  return (
    <Screen scroll={false}>
      <FlatList
        data={deleted}
        keyExtractor={(o) => o.id}
        ListEmptyComponent={<EmptyState icon="trash-can-outline" title="Корзина пуста" subtitle="Удалённые операции будут отображаться здесь" />}
        renderItem={({ item }) => {
          const category = categories.find((c) => c.id === item.categoryId);
          const account = accounts.find((a) => a.id === item.accountId);
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <OperationListItem
                  operation={item}
                  category={category}
                  account={account}
                  toAccount={accounts.find((a) => a.id === item.toAccountId)}
                  onPress={() => {}}
                />
              </View>
              <Button title="Восстановить" variant="ghost" onPress={() => onRestore(item.id)} />
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
