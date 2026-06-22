import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, LoadingState, Screen } from '../../components/common';
import { bankApi } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';
import { BankConnection } from '../../types';
import { formatDateLong } from '../../utils/format';

export function BankScreen() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setConnections(await bankApi.getConnections());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onResync = async (id: string) => {
    setSyncingId(id);
    try {
      await bankApi.resync(id);
      await load();
    } finally {
      setSyncingId(null);
    }
  };

  const onConnect = () => {
    Alert.alert('Подключение банка', 'Выберите банк для подключения (демо)', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Тинькофф',
        onPress: async () => {
          await bankApi.connectBank('Тинькофф Банк');
          await load();
        },
      },
    ]);
  };

  if (loading) return <LoadingState />;

  return (
    <Screen>
      <Text style={styles.subtitle}>
        Подключите банковские карты и счета, чтобы операции импортировались автоматически.
      </Text>

      {connections.length === 0 ? (
        <EmptyState icon="bank-outline" title="Нет подключённых банков" subtitle="Подключите банк, чтобы начать импорт операций" actionLabel="Подключить банк" onAction={onConnect} />
      ) : (
        connections.map((conn) => (
          <Card key={conn.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.bankIcon}>
                <MaterialCommunityIcons name="bank" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankName}>{conn.bankName}</Text>
                <Text style={styles.accountsCount}>{conn.accountsCount} счёт(а/ов)</Text>
              </View>
              <StatusBadge status={conn.status} />
            </View>

            {conn.lastSyncAt ? (
              <Text style={styles.syncInfo}>Последняя синхронизация: {formatDateLong(conn.lastSyncAt)}</Text>
            ) : null}

            {conn.status === 'error' ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{conn.errorMessage}</Text>
              </View>
            ) : null}

            <Button
              title={conn.status === 'error' ? 'Повторить подключение' : 'Загрузить операции заново'}
              variant="outline"
              loading={syncingId === conn.id}
              onPress={() => onResync(conn.id)}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ))
      )}

      {connections.length > 0 ? (
        <Button title="Подключить ещё один банк" onPress={onConnect} style={{ marginTop: spacing.md }} />
      ) : null}
    </Screen>
  );
}

function StatusBadge({ status }: { status: BankConnection['status'] }) {
  const config = {
    connected: { label: 'Подключено', color: colors.success },
    syncing: { label: 'Синхронизация', color: colors.warning },
    error: { label: 'Ошибка', color: colors.danger },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '22' }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bankName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  accountsCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  badgeText: {
    ...typography.small,
    fontWeight: '700',
  },
  syncInfo: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    flexShrink: 1,
  },
});
