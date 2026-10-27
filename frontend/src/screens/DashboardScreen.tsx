import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Avatar, Empty, ErrorBox, Icon, s, SectionHeading } from '../components/ui';
import { colors, categoryInfo } from '../lib/theme';
import { usePortal } from '../stores/portal';

export function DashboardScreen() {
  const { dashboard, loading, refresh, error } = usePortal();
  const overview = dashboard?.overview;
  return (
    <ScrollView
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />
      }
    >
      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.teal, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
          A HAPPIER CAMPUS STARTS HERE
        </Text>
        <Text style={s.title}>The bigger picture.</Text>
        <Text style={s.body}>Keep an eye on every fix and the people making it happen.</Text>
      </View>
      <ErrorBox message={error} onRetry={refresh} />
      <View style={[s.card, { backgroundColor: colors.tealDark, borderWidth: 0, gap: 20 }]}>
        <View style={s.section}>
          <Text style={{ color: '#B5D3C8', fontSize: 11 }}>ALL-TIME CAMPUS REQUESTS</Text>
          <Icon name="stats-chart-outline" color={colors.lime} size={23} />
        </View>
        <Text style={{ fontSize: 52, fontWeight: '600', letterSpacing: -2, color: '#fff' }}>
          {overview?.total ?? '—'}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            height: 7,
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: '#337966',
          }}
        >
          {overview && overview.total > 0 && (
            <>
              <View style={{ flex: overview.resolved, backgroundColor: colors.lime }} />
              <View style={{ flex: overview.in_progress, backgroundColor: '#7EBDE5' }} />
              <View style={{ flex: overview.pending, backgroundColor: '#F4CC81' }} />
              <View style={{ flex: overview.cancelled, backgroundColor: '#AAB8AF' }} />
            </>
          )}
        </View>
        <Text style={{ color: '#B5D3C8', fontSize: 12 }}>
          {overview?.resolved ?? 0} fixed · {overview?.in_progress ?? 0} in progress ·{' '}
          {overview?.pending ?? 0} pending · {overview?.cancelled ?? 0} cancelled
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[
          {
            label: 'Past target',
            value: overview?.overdue,
            icon: 'time-outline',
            color: colors.red,
            bg: colors.redBg,
          },
          {
            label: 'Need a worker',
            value: overview?.unassigned,
            icon: 'person-add-outline',
            color: colors.amber,
            bg: colors.amberBg,
          },
        ].map((stat) => (
          <View key={stat.label} style={[s.card, { flex: 1, gap: 11 }]}>
            <View
              style={{
                backgroundColor: stat.bg,
                alignSelf: 'flex-start',
                borderRadius: 12,
                padding: 9,
              }}
            >
              <Icon name={stat.icon} color={stat.color} size={20} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.ink }}>
              {stat.value ?? '—'}
            </Text>
            <Text style={s.hint}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <SectionHeading
        title="The people behind the fixes"
        right={`${dashboard?.workers.length ?? 0} workers`}
      />
      {!dashboard?.workers.length && (
        <Empty
          title="Build your campus crew"
          body="Add your first worker from the People tab. Their performance will appear here."
          icon="people-outline"
        />
      )}
      {dashboard?.workers.map((w, index) => {
        const cat = categoryInfo(w.specialty);
        return (
          <View key={w.id} style={[s.card, { gap: 17 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={w.name} color={cat.color} bg={cat.bg} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{w.name}</Text>
                <Text style={s.hint}>{cat.worker}</Text>
              </View>
              {index === 0 && w.resolved > 0 && (
                <View style={{ backgroundColor: colors.amberBg, padding: 9, borderRadius: 12 }}>
                  <Icon name="ribbon-outline" color={colors.amber} size={21} />
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { label: 'Fixed', value: w.resolved.toString() },
                { label: 'Open', value: w.open.toString() },
                {
                  label: 'On time',
                  value: w.on_time_percent === null ? '—' : `${Math.round(w.on_time_percent)}%`,
                },
                {
                  label: 'Avg. time',
                  value:
                    w.avg_resolution_hours === null ? '—' : `${w.avg_resolution_hours.toFixed(1)}h`,
                },
              ].map((item) => (
                <View key={item.label} style={{ flex: 1, gap: 5 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>
                    {item.value}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>{item.label}</Text>
                </View>
              ))}
            </View>
            <View
              style={{ height: 5, borderRadius: 5, backgroundColor: colors.bg, overflow: 'hidden' }}
            >
              <View
                style={{
                  width: `${w.on_time_percent ?? 0}%`,
                  height: 5,
                  backgroundColor: colors.teal,
                  borderRadius: 5,
                }}
              />
            </View>
            {w.overdue > 0 && (
              <Text style={{ color: colors.red, fontSize: 11 }}>
                {w.overdue} open {w.overdue === 1 ? 'request is' : 'requests are'} past the target
                time
              </Text>
            )}
          </View>
        );
      })}
      <View style={[s.card, { gap: 8, backgroundColor: '#EFF3EA' }]}>
        <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>
          A fair view of performance
        </Text>
        <Text style={s.hint}>
          On-time rate = fixes completed before their target ÷ completed fixes. Open overdue
          requests are shown separately. No completed fixes means no rate yet.
        </Text>
        <Text style={s.hint}>
          Targets: high 24h · regular 72h · low 120h. Reopening starts a new service cycle. Metrics
          use the latest cycle and current assignment.
        </Text>
      </View>
    </ScrollView>
  );
}
