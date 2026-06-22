import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../../theme';

interface GaugeProps {
  percent: number; // 0-100+
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function Gauge({ percent, size = 140, strokeWidth = 14, label, sublabel }: GaugeProps) {
  const clamped = Math.min(percent, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  let color = colors.success;
  if (percent >= 100) color = colors.danger;
  else if (percent >= 80) color = colors.warning;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[typography.h2, { color: colors.text }]}>{Math.round(percent)}%</Text>
        {label ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text> : null}
        {sublabel ? <Text style={[typography.small, { color: colors.textSecondary }]}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
});
