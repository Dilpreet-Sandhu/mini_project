import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, CategoryIcon, Icon } from './ui';
import { colors } from '../lib/theme';
import type { Complaint } from '../lib/types';
import { deadline, isOverdue, relativeDate } from '../lib/format';

export function ComplaintRow({
  item,
  onPress,
  showStudent,
}: {
  item: Complaint;
  onPress: () => void;
  showStudent?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.status.replace('_', ' ')}`}
      onPress={onPress}
      style={({ pressed }) => [r.row, { backgroundColor: pressed ? '#F1F6F2' : '#fff' }]}
    >
      <CategoryIcon category={item.category} />
      <View style={{ flex: 1, gap: 7 }}>
        <View style={r.top}>
          <Text numberOfLines={1} style={r.title}>
            {item.title}
          </Text>
          <Text style={r.time}>{relativeDate(item.created_at)}</Text>
        </View>
        <Text numberOfLines={1} style={r.description}>
          {showStudent
            ? `${item.student_name} · ${item.hostel} / ${item.room}`
            : item.worker_name
              ? `${item.worker_name} · ${item.description}`
              : item.description}
        </Text>
        <View style={r.bottom}>
          <Badge status={item.status} />
          {item.priority === 'high' && <Icon name="flag" color={colors.red} size={11} />}
          <Text style={[r.deadline, isOverdue(item) && { color: colors.red }]}>
            {deadline(item)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
const r = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 19,
    paddingHorizontal: 18,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  time: { fontSize: 10, color: colors.muted },
  description: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  deadline: { color: colors.muted, fontSize: 10 },
});
