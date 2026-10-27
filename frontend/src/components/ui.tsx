import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, categoryInfo, statuses } from '../lib/theme';
import type { Category, Status } from '../lib/types';
import { initials } from '../lib/format';

export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <Ionicons
      name={name as React.ComponentProps<typeof Ionicons>['name']}
      size={size}
      color={color}
    />
  );
}
export function Button({
  title,
  onPress,
  busy,
  disabled,
  secondary,
  danger,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  icon?: string;
  style?: ViewStyle;
}) {
  const color = secondary ? (danger ? colors.red : colors.teal) : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary
            ? danger
              ? colors.redBg
              : colors.mint
            : danger
              ? colors.red
              : colors.teal,
          opacity: disabled || busy ? 0.55 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <Icon name={icon} size={19} color={color} />}
          <Text style={[s.buttonText, { color }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#9BA8A1"
        accessibilityLabel={label}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 110, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}
export function ErrorBox({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={s.error}>
      <Icon name="alert-circle-outline" color={colors.red} size={20} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: colors.red, fontSize: 13, lineHeight: 20 }}>{message}</Text>
        {onRetry && (
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text style={{ fontWeight: '700', color: colors.red }}>Try again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function Avatar({
  name,
  size = 44,
  ring,
  color = colors.teal,
  bg = colors.mint,
}: {
  name: string;
  size?: number;
  ring?: boolean;
  color?: string;
  bg?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        padding: ring ? 3 : 0,
        borderRadius: size / 2,
        borderWidth: ring ? 1.5 : 0,
        borderColor: colors.teal,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size / 2,
          backgroundColor: bg,
        }}
      >
        <Text style={{ color, fontWeight: '700', fontSize: size * 0.32 }}>{initials(name)}</Text>
      </View>
    </View>
  );
}
export function CategoryIcon({ category, size = 48 }: { category: Category; size?: number }) {
  const info = categoryInfo(category);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: info.bg,
      }}
    >
      <Icon name={info.icon} color={info.color} size={size * 0.46} />
    </View>
  );
}
export function Badge({ status }: { status: Status }) {
  const info = statuses[status];
  return (
    <View style={[s.badge, { backgroundColor: info.bg }]}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: info.color }} />
      <Text style={{ color: info.color, fontSize: 11, fontWeight: '600' }}>{info.label}</Text>
    </View>
  );
}
export function Empty({
  icon = 'chatbubbles-outline',
  title,
  body,
}: {
  icon?: string;
  title: string;
  body: string;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={32} color={colors.teal} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
    </View>
  );
}
export function SectionHeading({ title, right }: { title: string; right?: string }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {right && <Text style={s.hint}>{right}</Text>}
    </View>
  );
}
export function ModalHeader({
  title,
  subtitle,
  close,
}: {
  title: string;
  subtitle?: string;
  close: () => void;
}) {
  return (
    <View style={s.modalHeader}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={close}
        style={s.back}
      >
        <Icon name="arrow-back" />
      </Pressable>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle && <Text style={s.hint}>{subtitle}</Text>}
      </View>
      <View style={s.brandDot}>
        <Icon name="leaf" size={18} color={colors.teal} />
      </View>
    </View>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 20, paddingBottom: 32 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.9, color: colors.ink },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  input: {
    color: colors.ink,
    fontSize: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  button: {
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: { fontSize: 14, fontWeight: '700' },
  error: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.redBg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  empty: { padding: 30, paddingVertical: 45, alignItems: 'center', gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    marginBottom: 5,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  emptyBody: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 20,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  back: { width: 32, height: 38, justifyContent: 'center' },
  brandDot: {
    width: 35,
    height: 35,
    backgroundColor: colors.mint,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
