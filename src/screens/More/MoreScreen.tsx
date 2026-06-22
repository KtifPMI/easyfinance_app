import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '../../components/common';
import { MoreStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

const ITEMS: { key: keyof MoreStackParamList; title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { key: 'AiAssistant', title: 'ИИ-ассистент', subtitle: 'Финансовый автопилот — спросите что угодно', icon: 'robot-outline', color: '#7C3AED' },
  { key: 'Bank', title: 'EasyBank', subtitle: 'Подключение банков и импорт операций', icon: 'bank', color: '#1565C0' },
  { key: 'Recommendations', title: 'Рекомендации', subtitle: 'Советы по управлению финансами', icon: 'lightbulb-on-outline', color: '#F59E0B' },
  { key: 'Informer', title: 'Информер', subtitle: 'Курсы валют, калькулятор и инструменты', icon: 'widgets-outline', color: '#16A34A' },
  { key: 'Settings', title: 'Настройки', subtitle: 'Профиль, тариф, уведомления', icon: 'cog-outline', color: '#6B7280' },
];

export function MoreScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  return (
    <Screen>
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{user?.plan === 'premium' ? 'Premium' : 'Free'}</Text>
        </View>
      </Card>

      {ITEMS.map((item) => (
        <Pressable key={item.key} style={styles.row} onPress={() => navigation.navigate(item.key as any)}>
          <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
            <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </Pressable>
      ))}

      <Pressable style={[styles.row, { marginTop: spacing.lg }]} onPress={() => logout()}>
        <View style={[styles.iconCircle, { backgroundColor: colors.danger + '22' }]}>
          <MaterialCommunityIcons name="logout" size={22} color={colors.danger} />
        </View>
        <Text style={[styles.rowTitle, { color: colors.danger }]}>Выйти из аккаунта</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h3,
    color: colors.white,
  },
  profileName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  profileEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  planBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  planBadgeText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  rowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
