import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Avatar,
  Badge,
  Button,
  CategoryIcon,
  ErrorBox,
  Field,
  Icon,
  ModalHeader,
  s,
} from '../components/ui';
import { colors, categoryInfo } from '../lib/theme';
import { complaintCode, deadline, fullDate, isOverdue } from '../lib/format';
import type { Detail } from '../lib/types';
import { errorMessage } from '../lib/api';
import { usePortal } from '../stores/portal';
import { useAuth } from '../stores/auth';

export function DetailScreen({ id, close }: { id: string; close: () => void }) {
  const user = useAuth((st) => st.user)!;
  const workers = usePortal((st) => st.workers);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [action, setAction] = useState<'resolve' | 'reopen' | 'cancel' | 'assign' | null>(null);
  const mounted = useRef(true);
  const mutating = useRef(false);
  const version = useRef(0);
  const load = useCallback(async () => {
    if (mutating.current) return;
    const current = ++version.current;
    try {
      const result = await usePortal.getState().detail(id);
      if (mounted.current && current === version.current) {
        setDetail(result);
        setError('');
      }
    } catch (e) {
      if (mounted.current && current === version.current) setError(errorMessage(e));
    }
  }, [id]);
  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' || Platform.OS === 'web') void load();
    }, 20000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [load]);
  async function perform(request: () => Promise<Detail>, clearMessage = false) {
    if (mutating.current) return;
    mutating.current = true;
    version.current++;
    setBusy(true);
    setError('');
    try {
      const result = await request();
      if (mounted.current) {
        setDetail(result);
        setAction(null);
        setNote('');
        if (clearMessage) setMessage('');
      }
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      mutating.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const complaint = detail?.complaint;
  const ownWorker = complaint?.assigned_to === user.id && user.role === 'worker';
  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader
        title="Complaint thread"
        subtitle={complaint ? complaintCode(complaint.id) : 'LOADING YOUR REQUEST'}
        close={close}
      />
      {!complaint ? (
        <View style={{ padding: 22, gap: 20 }}>
          <ErrorBox message={error} onRetry={load} />
          {!error && <ActivityIndicator color={colors.teal} style={{ padding: 50 }} />}
        </View>
      ) : (
        <>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, gap: 20 }}
          >
            <View style={[s.card, { gap: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CategoryIcon category={complaint.category} />
                <View style={{ flex: 1, gap: 7 }}>
                  <Text style={s.hint}>
                    {categoryInfo(complaint.category).label.toUpperCase()} ·{' '}
                    {complaint.priority.toUpperCase()} PRIORITY
                  </Text>
                  <Badge status={complaint.status} />
                </View>
              </View>
              <Text style={[s.title, { fontSize: 22 }]}>{complaint.title}</Text>
              <Text style={{ color: colors.ink, fontSize: 14, lineHeight: 23 }}>
                {complaint.description}
              </Text>
              <View style={{ height: 1, backgroundColor: colors.line }} />
              <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
                <Icon name="location-outline" size={16} color={colors.teal} />
                <Text style={{ color: colors.ink, fontSize: 12 }}>
                  {complaint.hostel} · Room {complaint.room}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Icon
                  name="time-outline"
                  size={16}
                  color={isOverdue(complaint) ? colors.red : colors.muted}
                />
                <Text
                  style={{ fontSize: 12, color: isOverdue(complaint) ? colors.red : colors.muted }}
                >
                  {deadline(complaint)} · {fullDate(complaint.due_at)}
                </Text>
              </View>
              <Text style={s.hint}>Reported {fullDate(complaint.created_at)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Avatar
                name={
                  user.role === 'student'
                    ? complaint.worker_name || 'Campus Crew'
                    : complaint.student_name
                }
                size={37}
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>
                  {user.role === 'student'
                    ? complaint.worker_name || 'Waiting for a specialist'
                    : complaint.student_name}
                </Text>
                <Text style={s.hint}>
                  {user.role === 'student'
                    ? 'Your assigned worker'
                    : `${complaint.hostel} · ${complaint.room}`}
                </Text>
              </View>
              {user.role !== 'student' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call student"
                  onPress={() => {
                    void Linking.openURL(
                      `tel:${complaint.student_phone.replace(/[^+0-9]/g, '')}`,
                    ).catch(() =>
                      setError(`Call ${complaint.student_phone} using your phone app.`),
                    );
                  }}
                  style={{ padding: 10, borderRadius: 13, backgroundColor: colors.mint }}
                >
                  <Icon name="call-outline" size={19} color={colors.teal} />
                </Pressable>
              )}
            </View>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
              <Text style={{ fontSize: 9, color: colors.muted, letterSpacing: 1.2 }}>
                THE STORY SO FAR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
            </View>
            {detail.events.map((event) =>
              event.kind === 'comment' ? (
                <View
                  key={event.id}
                  style={{
                    maxWidth: '88%',
                    alignSelf: event.actor_id === user.id ? 'flex-end' : 'flex-start',
                    backgroundColor: event.actor_id === user.id ? colors.mint : '#fff',
                    borderRadius: 18,
                    borderBottomRightRadius: event.actor_id === user.id ? 4 : 18,
                    borderBottomLeftRadius: event.actor_id === user.id ? 18 : 4,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.line,
                    gap: 7,
                  }}
                >
                  <Text style={{ color: colors.teal, fontSize: 10, fontWeight: '700' }}>
                    {event.actor_name} · {event.actor_role}
                  </Text>
                  <Text style={{ color: colors.ink, fontSize: 14, lineHeight: 21 }}>
                    {event.body}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 6,
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Text style={{ color: colors.muted, fontSize: 9 }}>
                      {fullDate(event.created_at)}
                    </Text>
                    {event.actor_id === user.id && (
                      <Icon name="checkmark" size={12} color={colors.teal} />
                    )}
                  </View>
                </View>
              ) : (
                <View
                  key={event.id}
                  style={{
                    alignSelf: 'center',
                    width: '92%',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: '#EDF1EA',
                    borderRadius: 15,
                    gap: 5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: colors.tealDark,
                      textAlign: 'center',
                    }}
                  >
                    {event.kind === 'resolved' ? '✓ ' : ''}
                    {event.body}
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.muted, textAlign: 'center' }}>
                    {event.actor_name} · {fullDate(event.created_at)}
                  </Text>
                </View>
              ),
            )}
            <ErrorBox message={error} onRetry={load} />
            {user.role === 'worker' && !complaint.assigned_to && complaint.status === 'pending' && (
              <Button
                title="Accept this complaint"
                icon="hand-left-outline"
                busy={busy}
                onPress={() => perform(() => usePortal.getState().claim(id))}
              />
            )}
            {ownWorker && complaint.status === 'pending' && (
              <Button
                title="Start working"
                icon="construct-outline"
                busy={busy}
                onPress={() => perform(() => usePortal.getState().status(id, 'in_progress'))}
              />
            )}
            {ownWorker && complaint.status === 'in_progress' && !action && (
              <Button
                title="Mark as fixed"
                icon="checkmark-circle-outline"
                busy={busy}
                onPress={() => setAction('resolve')}
              />
            )}
            {user.role === 'student' && complaint.status === 'resolved' && !action && (
              <Button
                title="Still not right? Reopen complaint"
                secondary
                icon="refresh-outline"
                onPress={() => setAction('reopen')}
              />
            )}
            {user.role === 'student' && complaint.status === 'pending' && !action && (
              <Button
                title="Cancel this complaint"
                secondary
                danger
                onPress={() => setAction('cancel')}
              />
            )}
            {user.role === 'admin' && complaint.status === 'pending' && !action && (
              <Button
                title="Assign a specialist"
                secondary
                icon="person-add-outline"
                onPress={() => setAction('assign')}
              />
            )}
            {action && (
              <View style={[s.card, { gap: 14 }]}>
                <Text style={s.sectionTitle}>
                  {action === 'resolve'
                    ? 'Another little thing, sorted.'
                    : action === 'reopen'
                      ? 'Let’s take another look.'
                      : action === 'cancel'
                        ? 'Cancel this request?'
                        : 'Choose the right pair of hands'}
                </Text>
                {(action === 'resolve' || action === 'reopen') && (
                  <Field
                    label={
                      action === 'resolve' ? 'What did you fix?' : 'What still needs attention?'
                    }
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={2000}
                    hint="At least 5 characters. This becomes part of the complaint thread."
                  />
                )}
                {action === 'cancel' && (
                  <Text style={s.body}>
                    This closes the complaint. You can submit a new request whenever you need help.
                  </Text>
                )}
                {action === 'assign' ? (
                  <>
                    {workers
                      .filter((w) => w.specialty === complaint.category)
                      .map((w) => (
                        <Button
                          secondary
                          key={w.id}
                          title={w.name}
                          busy={busy}
                          onPress={() => perform(() => usePortal.getState().assign(id, w.id))}
                        />
                      ))}
                    {!workers.some((w) => w.specialty === complaint.category) && (
                      <Text style={s.hint}>
                        No matching workers yet. Add a worker in the People tab first.
                      </Text>
                    )}
                  </>
                ) : (
                  <Button
                    busy={busy}
                    title={
                      action === 'resolve'
                        ? 'Confirm fix'
                        : action === 'reopen'
                          ? 'Reopen request'
                          : 'Yes, cancel request'
                    }
                    danger={action === 'cancel'}
                    disabled={action !== 'cancel' && note.trim().length < 5}
                    onPress={() =>
                      perform(() =>
                        usePortal
                          .getState()
                          .status(
                            id,
                            action === 'resolve'
                              ? 'resolved'
                              : action === 'reopen'
                                ? 'pending'
                                : 'cancelled',
                            note,
                          ),
                      )
                    }
                  />
                )}
                <Button
                  title="Go back"
                  secondary
                  disabled={busy}
                  onPress={() => {
                    setAction(null);
                    setNote('');
                  }}
                />
              </View>
            )}
            <Text style={[s.hint, { textAlign: 'center', paddingVertical: 4 }]}>
              A little kindness goes a long way. Keep it friendly.
            </Text>
          </ScrollView>
          {complaint.status !== 'cancelled' && (
            <View
              style={{
                padding: 14,
                paddingHorizontal: 20,
                borderTopWidth: 1,
                borderColor: colors.line,
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 10,
                backgroundColor: '#fff',
              }}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                maxLength={2000}
                multiline
                accessibilityLabel="Message about this complaint"
                placeholder="Add a message..."
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  backgroundColor: colors.bg,
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  maxHeight: 110,
                  fontSize: 14,
                  color: colors.ink,
                }}
              />
              <Pressable
                disabled={busy || !message.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                onPress={() => perform(() => usePortal.getState().comment(id, message), true)}
                style={{
                  backgroundColor: colors.teal,
                  borderRadius: 23,
                  width: 46,
                  height: 46,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: busy || !message.trim() ? 0.5 : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Icon name="paper-plane" color="#fff" size={20} />
                )}
              </Pressable>
            </View>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}
