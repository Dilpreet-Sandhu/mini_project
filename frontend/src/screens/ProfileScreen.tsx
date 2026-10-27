import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Button, ErrorBox, Field, Icon, s } from '../components/ui';
import { colors, categoryInfo } from '../lib/theme';
import { useAuth } from '../stores/auth';
import { usePortal } from '../stores/portal';
import { errorMessage } from '../lib/api';

export function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const complaints = usePortal((st) => st.complaints);
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [name, setName] = useState(user!.name);
  const [phone, setPhone] = useState(user!.phone);
  const [hostel, setHostel] = useState(user!.hostel || '');
  const [room, setRoom] = useState(user!.room || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!user) return null;
  const student = user.role === 'student';
  async function save() {
    setBusy(true);
    setError('');
    try {
      await updateProfile({ name, phone, ...(student ? { hostel, room } : {}) });
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.teal, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
          YOUR LITTLE CORNER
        </Text>
        <Text style={s.title}>Feels like you.</Text>
      </View>
      <View style={[s.card, { alignItems: 'center', gap: 10, paddingVertical: 28 }]}>
        <Avatar name={user.name} size={86} ring />
        <Text style={[s.title, { fontSize: 23, marginTop: 4 }]}>{user.name}</Text>
        <Text style={s.hint}>{user.email}</Text>
        <View
          style={{
            borderRadius: 20,
            backgroundColor: colors.mint,
            paddingHorizontal: 13,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: colors.teal, fontSize: 11, fontWeight: '600' }}>
            {user.role === 'admin'
              ? 'Administrator'
              : user.role === 'worker'
                ? categoryInfo(user.specialty!).worker
                : 'Student'}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignSelf: 'stretch',
            marginTop: 14,
            paddingTop: 20,
            borderTopWidth: 1,
            borderColor: colors.line,
          }}
        >
          {[
            { n: complaints.length, label: 'Requests' },
            { n: complaints.filter((c) => c.status === 'resolved').length, label: 'Fixed' },
            {
              n: complaints.filter((c) => ['pending', 'in_progress'].includes(c.status)).length,
              label: 'Open',
            },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
              <Text style={{ color: colors.ink, fontSize: 22, fontWeight: '700' }}>{stat.n}</Text>
              <Text style={s.hint}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[s.card, { gap: 20 }]}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>The details</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditing(!editing);
              setError('');
            }}
          >
            <Text style={{ color: colors.teal, fontWeight: '600', fontSize: 12 }}>
              {editing ? 'Cancel' : 'Edit profile'}
            </Text>
          </Pressable>
        </View>
        {editing ? (
          <>
            <Field label="Name" value={name} onChangeText={setName} maxLength={80} />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={24}
            />
            {student && (
              <>
                <Field label="Hostel" value={hostel} onChangeText={setHostel} maxLength={80} />
                <Field label="Room" value={room} onChangeText={setRoom} maxLength={20} />
                <Text style={s.hint}>
                  Room changes apply to new complaints. Previous complaints keep their original
                  location.
                </Text>
              </>
            )}
            <ErrorBox message={error} />
            <Button title="Save changes" onPress={save} busy={busy} />
          </>
        ) : (
          <>
            {[
              { icon: 'call-outline', label: 'Phone', value: user.phone },
              ...(student
                ? [
                    { icon: 'home-outline', label: 'Hostel', value: user.hostel },
                    { icon: 'key-outline', label: 'Room', value: user.room },
                  ]
                : []),
              {
                icon: 'calendar-outline',
                label: 'Part of the campus since',
                value: new Date(user.created_at).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                }),
              },
            ].map((item) => (
              <View
                key={item.label}
                style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: colors.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={item.icon} size={19} color={colors.teal} />
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={s.hint}>{item.label}</Text>
                  <Text selectable style={{ color: colors.ink, fontSize: 13, fontWeight: '500' }}>
                    {item.value || 'Not set'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
      {confirmLogout ? (
        <View style={[s.card, { gap: 13 }]}>
          <Text style={s.sectionTitle}>Ready to sign out?</Text>
          <Text style={s.hint}>Your complaints and account will be here when you return.</Text>
          <Button
            title="Yes, sign out"
            danger
            onPress={() => {
              void logout();
            }}
          />
          <Button title="Stay here" secondary onPress={() => setConfirmLogout(false)} />
        </View>
      ) : (
        <Button
          title="Sign out"
          secondary
          danger
          icon="log-out-outline"
          onPress={() => setConfirmLogout(true)}
        />
      )}
      <Text style={[s.hint, { textAlign: 'center', paddingVertical: 6 }]}>
        roomline. · A little care for campus life.\nVersion 1.0.0
      </Text>
    </ScrollView>
  );
}
