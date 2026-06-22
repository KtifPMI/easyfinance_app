import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, Input, Screen } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';

const CURRENCIES = ['RUB', 'USD', 'EUR'];

export function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'RUB');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [familyEnabled, setFamilyEnabled] = useState(false);

  const onLogout = () => {
    Alert.alert('Выйти из аккаунта?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.sectionTitle}>Профиль</Text>
      <Card style={styles.section}>
        <Input label="Имя" value={name} onChangeText={setName} />
        <Input label="Email" value={user?.email} editable={false} style={{ opacity: 0.6 }} />
      </Card>

      <Text style={styles.sectionTitle}>Семейный аккаунт</Text>
      <Card style={styles.section}>
        <SettingRow label="Семейный доступ" value={familyEnabled} onChange={setFamilyEnabled} />
        <Text style={styles.hint}>Делитесь бюджетом и операциями с членами семьи</Text>
      </Card>

      <Text style={styles.sectionTitle}>Валюта по умолчанию</Text>
      <Card style={styles.section}>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => (
            <Button
              key={c}
              title={c}
              variant={currency === c ? 'primary' : 'outline'}
              onPress={() => setCurrency(c)}
              style={{ flex: 1, marginHorizontal: 4, height: 44 }}
            />
          ))}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Тариф</Text>
      <Card style={styles.section}>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planName}>{user?.plan === 'premium' ? 'Premium' : 'Бесплатный'}</Text>
            <Text style={styles.hint}>{user?.plan === 'premium' ? 'Все функции открыты' : 'Базовые функции учёта'}</Text>
          </View>
          {user?.plan !== 'premium' ? <Button title="Перейти на Premium" onPress={() => {}} style={{ height: 40 }} /> : null}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Уведомления</Text>
      <Card style={styles.section}>
        <SettingRow label="Push-уведомления" value={pushEnabled} onChange={setPushEnabled} />
        <SettingRow label="Предупреждения о бюджете" value={budgetAlerts} onChange={setBudgetAlerts} />
      </Card>

      <Text style={styles.sectionTitle}>Безопасность</Text>
      <Card style={styles.section}>
        <SettingRow label="Вход по биометрии" value={biometric} onChange={setBiometric} />
      </Card>

      <Button title="Выйти из аккаунта" variant="outline" onPress={onLogout} style={{ borderColor: colors.danger, marginTop: spacing.sm }} />
    </Screen>
  );
}

function SettingRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text,
  },
  hint: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  currencyRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    ...typography.bodyBold,
    color: colors.text,
  },
});
