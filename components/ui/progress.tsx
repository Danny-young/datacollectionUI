import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressProps {
  value: number;
  style?: any;
  filledTrackStyle?: any;
}

export function Progress({ value, style, filledTrackStyle }: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  return (
    <View style={[styles.container, style]}>
      <View 
        style={[
          styles.filledTrack, 
          { width: `${percentage}%` },
          filledTrackStyle
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  filledTrack: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
}); 