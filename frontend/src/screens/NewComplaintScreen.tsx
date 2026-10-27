import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, CategoryIcon, ErrorBox, Field, Icon, ModalHeader, s } from '../components/ui';
import { categories, colors } from '../lib/theme';
import type { Category, Priority } from '../lib/types';
import { useAuth } from '../stores/auth';
import { usePortal } from '../stores/portal';
import { errorMessage } from '../lib/api';

export function NewComplaintScreen({
  close,
  created,
}: {
  close: () => void;
  created: (id: string) => void;
}) {
  const user = useAuth((st) => st.user)!;
  const [category, setCategory] = useState<Category>('electrical');
  const [priority, setPriority] = useState<Priority>('normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setError('');
    try {
      const result = await usePortal.getState().create({ title, description, category, priority });
      created(result.complaint.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader title="A little help, on the way" subtitle="NEW COMPLAINT" close={close} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <View style={{ gap: 7 }}>
          <Text style={s.title}>What’s not working?</Text>
          <Text style={s.body}>
            Tell us a little about the issue. We’ll put it in the right hands.
          </Text>
        </View>
        <View
          style={[
            s.card,
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: colors.mint,
              borderWidth: 0,
            },
          ]}
        >
          <Icon name="location-outline" color={colors.teal} />
          <View>
            <Text style={{ fontSize: 14, color: colors.tealDark, fontWeight: '700' }}>
              {user.hostel} · {user.room}
            </Text>
            <Text style={[s.hint, { color: colors.teal }]}>
              Your current room · edit in Profile
            </Text>
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Text style={s.label}>Choose the right specialist</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {categories.map((cat) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: category === cat.key }}
                onPress={() => setCategory(cat.key)}
                key={cat.key}
                style={{
                  width: '30%',
                  borderRadius: 17,
                  padding: 12,
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#fff',
                  borderWidth: 1.5,
                  borderColor: category === cat.key ? colors.teal : colors.line,
                }}
              >
                <CategoryIcon category={cat.key} size={35} />
                <Text style={{ fontSize: 10, color: colors.ink, fontWeight: '600' }}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Field
          label="Give it a short title"
          placeholder="e.g. My ceiling fan won’t turn on"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <Field
          label="Tell us what happened"
          placeholder="Where is the problem? When did it start? A few details help the worker prepare."
          value={description}
          onChangeText={setDescription}
          maxLength={3000}
          multiline
          hint={`${description.length}/3000 characters · at least 10 characters`}
        />
        <View style={{ gap: 11 }}>
          <Text style={s.label}>How soon does it need attention?</Text>
          {(
            [
              ['low', 'Can wait a little', 'Target within 5 days'],
              ['normal', 'Regular request', 'Target within 3 days'],
              ['high', 'Needs attention soon', 'Target within 24 hours'],
            ] as const
          ).map(([key, label, hint]) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: priority === key }}
              key={key}
              onPress={() => setPriority(key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#fff',
                padding: 15,
                borderWidth: 1,
                borderRadius: 15,
                borderColor: priority === key ? colors.teal : colors.line,
              }}
            >
              <Icon
                name={priority === key ? 'radio-button-on' : 'radio-button-off'}
                color={priority === key ? colors.teal : colors.muted}
                size={21}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>{label}</Text>
                <Text style={s.hint}>{hint}</Text>
              </View>
              {key === 'high' && <Icon name="flag-outline" color={colors.red} size={18} />}
            </Pressable>
          ))}
        </View>
        <ErrorBox message={error} />
        <Button
          title="Send complaint"
          icon="paper-plane-outline"
          onPress={submit}
          busy={busy}
          disabled={title.trim().length < 4 || description.trim().length < 10}
        />
        <Text style={[s.hint, { textAlign: 'center' }]}>
          Targets are service goals. For an immediate safety emergency, contact your hostel office
          directly.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
