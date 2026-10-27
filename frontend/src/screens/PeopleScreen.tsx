import React, { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Avatar, Button, Empty, ErrorBox, Field, Icon, s } from '../components/ui';
import { categories, categoryInfo, colors } from '../lib/theme';
import { usePortal } from '../stores/portal';
import { useAuth } from '../stores/auth';
import { errorMessage } from '../lib/api';
import type { Category } from '../lib/types';

export function PeopleScreen() {
  const { workers, refresh, loading, error } = usePortal();
  const admin = useAuth((st) => st.user?.role === 'admin');
  const [filter, setFilter] = useState<Category | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState<Category>('electrical');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  async function add() {
    setBusy(true);
    setFormError('');
    setSuccess('');
    try {
      await usePortal.getState().addWorker({ name, email, phone, password, specialty });
      setSuccess(`Account created for ${name}. Share the login details with the worker.`);
      setAdding(false);
      setPassword('');
      setName('');
      setEmail('');
      setPhone('');
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function contact(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setFormError(
        'No phone or email app is available on this device. You can use the contact details shown below.',
      );
    }
  }
  const list = workers.filter((w) => !filter || w.specialty === filter);
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />
      }
    >
      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.teal, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
          GOOD PEOPLE. BETTER LIVING.
        </Text>
        <Text style={s.title}>Your campus crew.</Text>
        <Text style={s.body}>The people who keep things running, always a call away.</Text>
      </View>
      {admin && (
        <Button
          title={adding ? 'Close new worker form' : 'Add a worker'}
          secondary
          icon={adding ? 'close' : 'person-add-outline'}
          onPress={() => {
            setAdding(!adding);
            setFormError('');
            setSuccess('');
          }}
        />
      )}
      {success && (
        <View style={[s.card, { backgroundColor: colors.mint }]}>
          <Text style={{ color: colors.teal, fontSize: 13, lineHeight: 21 }}>{success}</Text>
        </View>
      )}
      {adding && (
        <View style={[s.card, { gap: 15 }]}>
          <Text style={s.sectionTitle}>Welcome someone to the crew</Text>
          <Field label="Full name" value={name} onChangeText={setName} maxLength={80} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={24}
          />
          <Field
            label="Initial password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            hint="8–72 bytes. Give the credentials to this worker."
          />
          <Text style={s.label}>Specialty</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => setSpecialty(cat.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: specialty === cat.key }}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: specialty === cat.key ? colors.teal : colors.bg,
                }}
              >
                <Text style={{ fontSize: 11, color: specialty === cat.key ? '#fff' : colors.ink }}>
                  {cat.worker}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button
            title="Create worker account"
            onPress={add}
            busy={busy}
            disabled={!name.trim() || !email.trim() || !phone.trim() || password.length < 8}
          />
        </View>
      )}
      <ErrorBox message={formError || error} onRetry={error ? refresh : undefined} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {[{ key: null, label: 'Everyone' }, ...categories].map((cat) => (
          <Pressable
            key={cat.key || 'all'}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === cat.key }}
            onPress={() => setFilter(cat.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor: filter === cat.key ? colors.teal : '#EDF1ED',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: filter === cat.key ? '#fff' : colors.muted,
              }}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {!list.length && (
        <Empty
          icon="people-outline"
          title="The crew is on its way"
          body="Workers added by your administrator will appear here."
        />
      )}
      {list.map((w) => {
        const info = categoryInfo(w.specialty!);
        return (
          <View key={w.id} style={[s.card, { gap: 17 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={w.name} size={54} color={info.color} bg={info.bg} ring />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{w.name}</Text>
                <Text style={{ fontSize: 12, color: info.color }}>{info.worker}</Text>
              </View>
              <Icon name={info.icon} color={info.color} size={22} />
            </View>
            <View style={{ height: 1, backgroundColor: colors.line }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text selectable style={{ color: colors.ink, fontSize: 13 }}>
                  {w.phone}
                </Text>
                <Text selectable style={s.hint}>
                  {w.email}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Email ${w.name}`}
                onPress={() => contact(`mailto:${w.email}`)}
                style={{ backgroundColor: colors.bg, padding: 11, borderRadius: 14 }}
              >
                <Icon name="mail-outline" color={colors.teal} size={20} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Call ${w.name}`}
                onPress={() => contact(`tel:${w.phone.replace(/[^+0-9]/g, '')}`)}
                style={{ backgroundColor: colors.mint, padding: 11, borderRadius: 14 }}
              >
                <Icon name="call-outline" color={colors.teal} size={20} />
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
