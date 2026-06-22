import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

export function ProgressBar({ percent, color, height = 8 }: { percent: number; color?: string; height?: number }) {
  const clamped = Math.max(0, Math.min(percent, 100));
  let barColor = color;
  if (!barColor) {
    barColor = percent >= 100 ? colors.danger : percent >= 80 ? colors.warning : colors.success;
  }

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: barColor, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
