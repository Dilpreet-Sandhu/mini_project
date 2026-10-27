import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CategoryIcon, Empty, ErrorBox, Icon, s, SectionHeading } from '../components/ui';
import { ComplaintRow } from '../components/ComplaintRow';
import { colors, categories } from '../lib/theme';
import { useAuth } from '../stores/auth';
import { usePortal } from '../stores/portal';
import type { Category } from '../lib/types';

export function ComplaintsScreen({
  history,
  open,
  create,
}: {
  history?: boolean;
  open: (id: string) => void;
  create: () => void;
}) {
  const user = useAuth((st) => st.user)!;
  const { complaints, loading, error, refresh } = usePortal();
  const [category, setCategory] = useState<Category | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const student = user.role === 'student';
  const admin = user.role === 'admin';
  const base = useMemo(
    () =>
      complaints.filter(
        (c) =>
          admin ||
          (history
            ? ['resolved', 'cancelled'].includes(c.status)
            : ['pending', 'in_progress'].includes(c.status)),
      ),
    [complaints, history, admin],
  );
  const shown = base.filter(
    (c) =>
      (!category || c.category === category) &&
      (filter === 'all' ||
        c.status === filter ||
        (filter === 'unassigned' && !c.assigned_to && c.status === 'pending')) &&
      `${c.title} ${c.description} ${c.room} ${c.student_name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const active = complaints.filter((c) => ['pending', 'in_progress'].includes(c.status)).length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const filters = admin
    ? [
        ['all', 'All'],
        ['pending', 'Pending'],
        ['in_progress', 'In progress'],
        ['resolved', 'Fixed'],
        ['cancelled', 'Cancelled'],
      ]
    : history
      ? [
          ['all', 'All'],
          ['resolved', 'Fixed'],
          ['cancelled', 'Cancelled'],
        ]
      : [
          ['all', 'All'],
          ['pending', 'Pending'],
          ['in_progress', 'In progress'],
          ...(!student ? [['unassigned', 'Unassigned']] : []),
        ];
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />
      }
      contentContainerStyle={{ paddingBottom: 90 }}
    >
      <View style={c.intro}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={c.eyebrow}>
            {history
              ? admin
                ? 'CAMPUS OVERVIEW'
                : 'THE LITTLE THINGS, SORTED'
              : student
                ? `${user.hostel} · ROOM ${user.room}`
                : 'YOUR SPECIALIST WORKSPACE'}
          </Text>
          <Text style={s.title}>
            {history
              ? admin
                ? 'All complaints'
                : 'Looking good.'
              : student
                ? `Hey, ${user.name.split(' ')[0]} 👋`
                : 'Let’s make it right.'}
          </Text>
          <Text style={s.body}>
            {history
              ? 'Every fix has a story. Here’s yours.'
              : student
                ? 'A little issue? Let’s get it sorted.'
                : 'Your next fix makes someone’s day.'}
          </Text>
        </View>
      </View>
      {!history && (
        <View style={c.summary}>
          <View style={{ flex: 1 }}>
            <Text style={c.summaryKicker}>A LITTLE CARE GOES A LONG WAY</Text>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 14 }}>
              <View>
                <Text style={c.number}>{active.toString().padStart(2, '0')}</Text>
                <Text style={c.summaryLabel}>{student ? 'Open requests' : 'In your queue'}</Text>
              </View>
              <View style={c.verticalLine} />
              <View>
                <Text style={[c.number, { color: colors.lime }]}>
                  {resolved.toString().padStart(2, '0')}
                </Text>
                <Text style={c.summaryLabel}>Problems fixed</Text>
              </View>
            </View>
          </View>
          <Icon name="happy-outline" size={50} color="#86B4A4" />
        </View>
      )}
      {!history && (student || admin) && (
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: 22 }}>
            <SectionHeading title="What needs some care?" right="Choose a category" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 22,
              gap: 20,
              paddingTop: 16,
              paddingBottom: 3,
            }}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                accessibilityRole="button"
                accessibilityState={{ selected: category === cat.key }}
                onPress={() => setCategory(category === cat.key ? null : cat.key)}
                style={{
                  alignItems: 'center',
                  gap: 8,
                  opacity: category && category !== cat.key ? 0.45 : 1,
                }}
              >
                <View
                  style={{
                    padding: 4,
                    borderRadius: 28,
                    borderWidth: 1.5,
                    borderColor: category === cat.key ? colors.teal : 'transparent',
                  }}
                >
                  <CategoryIcon category={cat.key} size={49} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.ink }}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={{ padding: 22, paddingBottom: 14, gap: 16 }}>
        <SectionHeading
          title={
            history
              ? admin
                ? 'Every request, one place'
                : 'Your complaint history'
              : student
                ? 'Your conversations'
                : 'Your work queue'
          }
          right={`${shown.length} requests`}
        />
        <View style={c.search}>
          <Icon name="search-outline" color={colors.muted} size={19} />
          <TextInput
            style={{ flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 2 }}
            placeholder="Search complaints..."
            accessibilityLabel="Search complaints"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7 }}
        >
          {filters.map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: key === filter }}
              style={[c.chip, key === filter && { backgroundColor: colors.teal }]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: key === filter ? '#fff' : colors.muted,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ErrorBox message={error} onRetry={refresh} />
      </View>
      <View
        style={{
          backgroundColor: colors.paper,
          marginHorizontal: 14,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        {loading && !complaints.length ? (
          <ActivityIndicator style={{ padding: 40 }} color={colors.teal} />
        ) : !shown.length ? (
          <Empty
            title={
              search || category || filter !== 'all'
                ? 'No matches just yet'
                : history
                  ? 'A fresh start'
                  : 'All quiet here'
            }
            body={
              search || category || filter !== 'all'
                ? 'Try another search or change your filters.'
                : history
                  ? 'Completed and cancelled complaints will appear here.'
                  : student
                    ? 'Your open complaints will appear here. Tap + to tell us what needs fixing.'
                    : 'New requests matching your specialty will appear here.'
            }
          />
        ) : (
          shown.map((item) => (
            <ComplaintRow
              key={item.id}
              item={item}
              showStudent={!student}
              onPress={() => open(item.id)}
            />
          ))
        )}
      </View>
      {student && !history && (
        <Pressable accessibilityRole="button" onPress={create} style={c.newHint}>
          <Icon name="add-circle-outline" color={colors.teal} size={18} />
          <Text style={{ fontSize: 12, color: colors.teal, fontWeight: '600' }}>
            Something else? Start a new complaint
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
const c = StyleSheet.create({
  intro: { padding: 22, paddingTop: 15, flexDirection: 'row' },
  eyebrow: { fontSize: 9, color: colors.teal, letterSpacing: 1.3, fontWeight: '700' },
  summary: {
    marginHorizontal: 22,
    backgroundColor: colors.tealDark,
    borderRadius: 24,
    padding: 23,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryKicker: { color: '#9AC4B6', fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  number: { fontSize: 31, fontWeight: '600', color: '#fff', letterSpacing: -1 },
  summaryLabel: { color: '#B2D0C5', fontSize: 10, marginTop: 4 },
  verticalLine: { width: 1, backgroundColor: '#3D7A6B', marginVertical: 8 },
  search: {
    backgroundColor: '#EDF0EB',
    borderRadius: 13,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  chip: { borderRadius: 20, backgroundColor: '#EDF1ED', paddingHorizontal: 14, paddingVertical: 9 },
  newHint: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 24, padding: 10 },
});
