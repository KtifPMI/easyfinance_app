import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/common';
import { Chip } from '../../components/common/Chip';
import { RootStackParamList } from '../../navigation/types';
import { useFinanceStore } from '../../store/financeStore';
import { colors, radius, spacing, typography } from '../../theme';
import { OperationType } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddOperation'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_OPTIONS: { key: OperationType; label: string; color: string }[] = [
  { key: 'expense', label: 'Расход', color: colors.expense },
  { key: 'income', label: 'Доход', color: colors.income },
  { key: 'transfer', label: 'Перевод', color: colors.transfer },
];

export function AddOperationScreen({ route }: Props) {
  const navigation = useNavigation<Nav>();
  const { accounts, categories, addOperation } = useFinanceStore();

  const initialType = route.params?.type || 'expense';

  const [type, setType] = useState<OperationType>(initialType);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  useEffect(() => {
    if (accounts.length > 0) {
      setAccountId(prev => prev || accounts[0].id);
      const other = accounts.find(a => a.id !== accounts[0].id);
      setToAccountId(prev => prev || (other?.id ?? accounts[0].id));
    }
  }, [accounts.length]);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const canSave = Number(amount) > 0 && accountId && (type !== 'transfer' || (toAccountId && toAccountId !== accountId));

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await addOperation({
        type,
        amount: Number(amount),
        currency: 'RUB',
        date: new Date().toISOString(),
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        comment: comment || undefined,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.typeButton, type === opt.key && { backgroundColor: opt.color + '22', borderColor: opt.color }]}
              onPress={() => {
                setType(opt.key);
                setCategoryId(undefined);
              }}
            >
              <Text style={[styles.typeLabel, type === opt.key && { color: opt.color, fontWeight: '700' }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.amountWrapper}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.border}
            autoFocus
          />
          <Text style={styles.currency}>₽</Text>
        </View>

        <Text style={styles.sectionLabel}>Счёт {type === 'transfer' ? 'списания' : ''}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {accounts.map((acc) => (
            <Chip key={acc.id} label={acc.name} active={accountId === acc.id} onPress={() => setAccountId(acc.id)} />
          ))}
        </ScrollView>

        {type === 'transfer' ? (
          <>
            <Text style={styles.sectionLabel}>Счёт зачисления</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((acc) => (
                  <Chip key={acc.id} label={acc.name} active={toAccountId === acc.id} onPress={() => setToAccountId(acc.id)} />
                ))}
            </ScrollView>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Категория</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.categoryItem}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: cat.color + '22' },
                      categoryId === cat.id && { borderWidth: 2, borderColor: cat.color },
                    ]}
                  >
                    <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Комментарий</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Например: Пятёрочка"
          placeholderTextColor={colors.textSecondary}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Сохранить" onPress={onSave} disabled={!canSave} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  typeLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  amountInput: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.text,
    minWidth: 80,
    textAlign: 'right',
  },
  currency: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipsRow: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    ...typography.small,
    color: colors.text,
    textAlign: 'center',
  },
  commentInput: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    ...typography.body,
    color: colors.text,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
