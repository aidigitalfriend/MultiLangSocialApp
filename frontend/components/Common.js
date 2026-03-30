import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TEAL, WHITE, DARK, GRAY, GREEN, RED } from './theme';

export const Avatar = ({ name, size = 48, online, color }) => {
  const initial = (name || '?')[0].toUpperCase();
  const bg = color || TEAL;
  return (
    <View style={[st.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[st.avatarText, { fontSize: size * 0.38 }]}>{initial}</Text>
      {online !== undefined && (
        <View style={[st.onlineDot, { backgroundColor: online ? GREEN : GRAY, right: 0, bottom: 0, width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125 }]} />
      )}
    </View>
  );
};

export const Badge = ({ count }) => {
  if (!count) return null;
  return (
    <View style={st.badge}>
      <Text style={st.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const formatCallDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const st = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { color: WHITE, fontWeight: '700' },
  onlineDot: { position: 'absolute', borderWidth: 2, borderColor: WHITE },
  badge: { backgroundColor: TEAL, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: WHITE, fontSize: 11, fontWeight: '700' },
});
