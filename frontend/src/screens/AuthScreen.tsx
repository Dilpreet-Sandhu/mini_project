import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, ErrorBox, Field, Icon, s } from '../components/ui';
import { colors } from '../lib/theme';
import { errorMessage } from '../lib/api';
import { useAuth } from '../stores/auth';

export function AuthScreen() {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hostel, setHostel] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (register)
        await useAuth.getState().register({ name, email, password, phone, hostel, room });
      else await useAuth.getState().login(email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={a.content}>
        <View style={a.wordmark}>
          <View style={a.logo}>
            <Icon name="chatbubble-ellipses" color="#fff" size={26} />
          </View>
          <Text style={a.brand}>
            roomline<Text style={{ color: colors.teal }}>.</Text>
          </Text>
          <View style={a.campus}>
            <Text style={a.campusText}>CAMPUS CARE</Text>
          </View>
        </View>
        {!register && (
          <View style={a.art}>
            <View style={a.artCircle}>
              <Icon name="home-outline" size={65} color={colors.teal} />
            </View>
            <View style={[a.artBubble, { top: 22, left: 12, transform: [{ rotate: '-8deg' }] }]}>
              <Icon name="flash" size={20} color="#A87B20" />
              <Text style={a.artText}>Fan not working?</Text>
            </View>
            <View
              style={[
                a.artBubble,
                {
                  bottom: 20,
                  right: 9,
                  backgroundColor: colors.teal,
                  transform: [{ rotate: '5deg' }],
                },
              ]}
            >
              <Icon name="checkmark-done" color={colors.lime} size={22} />
              <Text style={[a.artText, { color: '#fff' }]}>We’re on it.</Text>
            </View>
            <View style={a.spark}>
              <Icon name="sparkles" color={colors.teal} size={24} />
            </View>
          </View>
        )}
        <View style={{ gap: 9 }}>
          <Text style={s.title}>
            {register ? 'Make yourself at home.' : 'A better room.\nA better campus.'}
          </Text>
          <Text style={s.body}>
            {register
              ? 'Create your student account. We’ll take care of the little things.'
              : 'Report a problem, follow the fix, and get back to what matters.'}
          </Text>
        </View>
        <View style={{ gap: 16 }}>
          {register && (
            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              maxLength={80}
              autoComplete="name"
            />
          )}
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@college.edu"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            maxLength={254}
          />
          <View>
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder={register ? 'At least 8 characters' : 'Your password'}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={register ? 'new-password' : 'current-password'}
              onSubmitEditing={register ? undefined : submit}
              style={{ paddingRight: 52 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword(!showPassword)}
              style={a.eye}
            >
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                color={colors.muted}
                size={21}
              />
            </Pressable>
          </View>
          {register && (
            <>
              <Field
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                placeholder="Your contact number"
                keyboardType="phone-pad"
                maxLength={24}
                autoComplete="tel"
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1.5 }}>
                  <Field
                    label="Hostel / building"
                    value={hostel}
                    onChangeText={setHostel}
                    placeholder="Maple House"
                    maxLength={80}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Room"
                    value={room}
                    onChangeText={setRoom}
                    placeholder="B-204"
                    maxLength={20}
                  />
                </View>
              </View>
            </>
          )}
          <ErrorBox message={error} />
          <Button
            title={register ? 'Create account' : 'Let’s get you in'}
            icon="arrow-forward"
            onPress={submit}
            busy={busy}
            disabled={
              !email.trim() ||
              !password ||
              (register && (!name.trim() || !phone.trim() || !hostel.trim() || !room.trim()))
            }
          />
          <Pressable
            disabled={busy}
            accessibilityRole="button"
            onPress={() => {
              setRegister(!register);
              setError('');
            }}
            style={{ alignItems: 'center', padding: 8 }}
          >
            <Text style={s.hint}>
              {register ? 'Already part of the campus? ' : 'New around here? '}
              <Text style={{ color: colors.teal, fontWeight: '700' }}>
                {register ? 'Sign in' : 'Create an account'}
              </Text>
            </Text>
          </Pressable>
        </View>
        <View style={a.footer}>
          <Icon name="shield-checkmark-outline" size={15} color={colors.muted} />
          <Text style={s.hint}>
            {register
              ? 'Worker accounts are created by your administrator.'
              : 'One sign-in. The right space for every role.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const a = StyleSheet.create({
  content: { padding: 28, paddingTop: 30, gap: 26, flexGrow: 1, justifyContent: 'center' },
  wordmark: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 3 },
  logo: {
    backgroundColor: colors.teal,
    width: 45,
    height: 45,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: { fontSize: 29, color: colors.ink, fontWeight: '700', letterSpacing: -1.4 },
  campus: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 7,
    padding: 6,
  },
  campusText: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  art: { height: 190, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  artCircle: {
    width: 156,
    height: 156,
    backgroundColor: colors.mint,
    borderRadius: 78,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 9,
    borderColor: '#EFF5ED',
  },
  artBubble: {
    position: 'absolute',
    paddingVertical: 14,
    paddingHorizontal: 17,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
  },
  artText: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  spark: { position: 'absolute', right: 40, top: 20 },
  eye: { position: 'absolute', right: 16, bottom: 14 },
  footer: { flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center' },
});
