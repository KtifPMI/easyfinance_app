import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState, LoadingState, Screen } from '../../components/common';
import { useFinanceStore } from '../../store/financeStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatDayLabel, formatMoney, groupByDay } from '../../utils/format';

function getMonthDays(year: number, month: number) {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function CalendarScreen() {
  const { events, isLoading, loaded, loadAll } = useFinanceStore();
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded]);

  if (isLoading && !loaded) return <LoadingState />;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = getMonthDays(year, month);
  const firstDayOffset = (days[0].getDay() + 6) % 7; // make Monday first

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    events.forEach((e) => {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  const monthEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const groups = groupByDay([...monthEvents].sort((a, b) => (a.date > b.date ? 1 : -1)));

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.monthLabel}>{cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
          <Text key={d} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const dayEvents = eventsByDate.get(key) || [];
          const isToday = key === new Date().toISOString().slice(0, 10);
          return (
            <View key={key} style={[styles.dayCell, isToday && styles.todayCell]}>
              <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{d.getDate()}</Text>
              {dayEvents.length > 0 ? (
                <View style={styles.dotsRow}>
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        { backgroundColor: e.type === 'income' ? colors.income : e.type === 'expense' ? colors.expense : colors.transfer },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>События в этом месяце</Text>
      {groups.length === 0 ? (
        <EmptyState icon="calendar-blank-outline" title="Нет событий" subtitle="Запланированные платежи и напоминания появятся здесь" />
      ) : (
        groups.map((group) => (
          <View key={group.date} style={styles.group}>
            <Text style={styles.groupTitle}>{formatDayLabel(group.items[0].date)}</Text>
            {group.items.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.eventIcon}>
                  <MaterialCommunityIcons
                    name={event.isRecurring ? 'autorenew' : event.type === 'reminder' ? 'bell-outline' : 'calendar'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.isRecurring ? <Text style={styles.eventSubtitle}>Повторяется ежемесячно</Text> : null}
                </View>
                {event.amount ? (
                  <Text style={[styles.eventAmount, { color: event.type === 'income' ? colors.income : colors.text }]}>
                    {event.type === 'income' ? '+' : '-'}{formatMoney(event.amount)}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthLabel: {
    ...typography.h3,
    color: colors.text,
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.small,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.round,
  },
  dayNumber: {
    ...typography.caption,
    color: colors.text,
  },
  todayNumber: {
    color: colors.primary,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  group: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
  },
  eventSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  eventAmount: {
    ...typography.bodyBold,
  },
});
