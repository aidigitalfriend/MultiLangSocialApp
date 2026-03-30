import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, RED } from './theme';
import { Avatar, formatTime } from './Common';

export default function ContactInfo({ user, onlineUsers, onBack, onBlock, onMessage, callHistory }) {
  const online = onlineUsers && onlineUsers.has(user.id);
  const recentCalls = (callHistory || []).slice(0, 5);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backArrow}>✕</Text></TouchableOpacity>
        <Text style={s.title}>Contact Info</Text>
      </View>

      <ScrollView style={s.content}>
        {/* Profile section */}
        <View style={s.profile}>
          <Avatar name={user.username} size={80} online={online} />
          <Text style={s.name}>{user.username}</Text>
          <Text style={s.status}>{online ? '🟢 Online' : user.lastSeen ? `Last seen ${formatTime(user.lastSeen)}` : 'Offline'}</Text>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ABOUT</Text>
          <Text style={s.about}>{user.about || 'Hey there! I am using Voice 4U'}</Text>
        </View>

        {/* Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>INFO</Text>
          {user.email && (
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>📧</Text>
              <Text style={s.infoText}>{user.email}</Text>
            </View>
          )}
          {user.language && (
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>🌐</Text>
              <Text style={s.infoText}>{user.language}</Text>
            </View>
          )}
        </View>

        {/* Recent calls */}
        {recentCalls.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>RECENT CALLS</Text>
            {recentCalls.map(c => (
              <View key={c.id} style={s.callRow}>
                <Text style={s.callIcon}>{c.callType === 'video' ? '📹' : '📞'}</Text>
                <View style={s.callInfo}>
                  <Text style={s.callDir}>{c.status === 'missed' ? '❌ Missed' : c.status === 'answered' ? '✅ Answered' : '⛔ Rejected'}</Text>
                  <Text style={s.callTime}>{formatTime(c.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={onMessage}>
            <Text style={s.actionIcon}>💬</Text>
            <Text style={s.actionText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionIcon}>📞</Text>
            <Text style={s.actionText}>Voice Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionIcon}>📹</Text>
            <Text style={s.actionText}>Video Call</Text>
          </TouchableOpacity>
        </View>

        {/* Block */}
        <TouchableOpacity style={s.blockBtn} onPress={onBlock}>
          <Text style={s.blockText}>🚫 Block {user.username}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: SIDEBAR_HEADER, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 20, color: '#666' },
  title: { fontSize: 17, fontWeight: '600', color: DARK, marginLeft: 12 },
  content: { flex: 1 },
  profile: { alignItems: 'center', paddingVertical: 30, backgroundColor: WHITE },
  name: { fontSize: 22, fontWeight: '700', color: DARK, marginTop: 12 },
  status: { fontSize: 14, color: '#888', marginTop: 4 },
  section: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 8, borderTopColor: '#F0F0F0' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: TEAL, letterSpacing: 0.5, marginBottom: 10 },
  about: { fontSize: 15, color: DARK, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: 15, color: DARK },
  callRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  callIcon: { fontSize: 18 },
  callInfo: { flex: 1 },
  callDir: { fontSize: 14, color: DARK },
  callTime: { fontSize: 12, color: '#999', marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, borderTopWidth: 8, borderTopColor: '#F0F0F0' },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 28 },
  actionText: { fontSize: 12, color: TEAL, fontWeight: '600' },
  blockBtn: { marginHorizontal: 20, marginVertical: 20, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: RED, alignItems: 'center' },
  blockText: { color: RED, fontSize: 15, fontWeight: '600' },
});
