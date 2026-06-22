import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '../../components/common';
import { useFinanceStore } from '../../store/financeStore';
import { colors, radius, spacing, typography } from '../../theme';

// Популярные цели с реального EasyFinance.ru (98К последователей у подушки)
const POPULAR_GOALS = [
  { title: 'Финансовая подушка', icon: 'shield-check' as const, color: '#16A34A', target: 300000, months: 12 },
  { title: 'Отпуск', icon: 'beach' as const, color: '#0EA5E9', target: 100000, months: 6 },
  { title: 'Автомобиль', icon: 'car' as const, color: '#3B82F6', target: 1000000, months: 36 },
  { title: 'Квартира', icon: 'home' as const, color: '#8B5CF6', target: 3000000, months: 60 },
  { title: 'Компьютер', icon: 'laptop' as const, color: '#7C3AED', target: 150000, months: 6 },
  { title: 'Образование', icon: 'school' as const, color: '#F59E0B', target: 200000, months: 12 },
  { title: 'Путешествие', icon: 'airplane' as const, color: '#06B6D4', target: 150000, months: 8 },
  { title: 'Подарок', icon: 'gift' as const, color: '#EC4899', target: 30000, months: 3 },
];

const ICONS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { icon: 'shield-check', color: '#16A34A' },
  { icon: 'beach', color: '#0EA5E9' },
  { icon: 'laptop', color: '#7C3AED' },
  { icon: 'car', color: '#3B82F6' },
  { icon: 'home', color: '#8B5CF6' },
  { icon: 'gift', color: '#EC4899' },
  { icon: 'school', color: '#F59E0B' },
  { icon: 'airplane', color: '#06B6D4' },
];

export function AddGoalScreen() {
  const navigation = useNavigation();
  const { addGoal } = useFinanceStore();

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [months, setMonths] = useState('6');
  const [iconIndex, setIconIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && Number(target) > 0;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + Number(months || '1'));
      const targetAmount = Number(target);
      const currentAmount = Number(current || '0');
      const remaining = Math.max(targetAmount - currentAmount, 0);
      const monthlyRecommendation = Math.ceil(remaining / Number(months || '1'));

      await addGoal({
        title: title.trim(),
        targetAmount,
        currentAmount,
        deadline: deadline.toISOString(),
        icon: ICONS[iconIndex].icon as string,
        color: ICONS[iconIndex].color,
        monthlyRecommendation,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (tpl: typeof POPULAR_GOALS[0]) => {
    setTitle(tpl.title);
    setTarget(String(tpl.target));
    setMonths(String(tpl.months));
    const idx = ICONS.findIndex(i => i.icon === tpl.icon && i.color === tpl.color);
    if (idx >= 0) setIconIndex(idx);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
      <Text style={styles.sectionLabel}>Популярные цели</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
        {POPULAR_GOALS.map((tpl) => (
          <Pressable key={tpl.title} style={styles.tplChip} onPress={() => applyTemplate(tpl)}>
            <MaterialCommunityIcons name={tpl.icon} size={16} color={tpl.color} />
            <Text style={styles.tplChipText}>{tpl.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Input label="Название цели" placeholder="Например: Подушка безопасности" value={title} onChangeText={setTitle} />
      <Input label="Сумма цели, ₽" placeholder="0" keyboardType="number-pad" value={target} onChangeText={(v) => setTarget(v.replace(/[^0-9]/g, ''))} />
      <Input label="Уже накоплено, ₽" placeholder="0" keyboardType="number-pad" value={current} onChangeText={(v) => setCurrent(v.replace(/[^0-9]/g, ''))} />
      <Input label="Срок, месяцев" placeholder="6" keyboardType="number-pad" value={months} onChangeText={(v) => setMonths(v.replace(/[^0-9]/g, ''))} />

      <Text style={styles.label}>Иконка</Text>
      <View style={styles.iconGrid}>
        {ICONS.map((item, idx) => (
          <Pressable
            key={idx}
            style={[
              styles.iconItem,
              { backgroundColor: item.color + '22' },
              iconIndex === idx && { borderWidth: 2, borderColor: item.color },
            ]}
            onPress={() => setIconIndex(idx)}
          >
            <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
          </Pressable>
        ))}
      </View>

      <Button title="Создать цель" onPress={onSave} disabled={!canSave} loading={saving} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tplChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  tplChipText: { ...typography.small, color: colors.text },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
