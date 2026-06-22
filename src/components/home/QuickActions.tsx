import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface Action {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress: () => void;
}

export function QuickActions({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable key={action.key} style={styles.item} onPress={action.onPress}>
          <View style={[styles.iconCircle, { backgroundColor: action.color + '22' }]}>
            <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.small,
    color: colors.text,
    textAlign: 'center',
  },
});
