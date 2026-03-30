import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from './Common';
import { DARK, SIDEBAR_HEADER, BORDER, TEAL } from './theme';

export default function ChatHeader({ user, isTyping, onlineUsers, onVoiceCall, onVideoCall, onInfoPress }) {
  const isOnline = onlineUsers.has(user.id);
  const statusText = isTyping ? 'typing...' : (isOnline ? 'online' : (user.lastSeen ? `last seen ${new Date(user.lastSeen).toLocaleString()}` : 'offline'));

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={onInfoPress} style={s.userInfo}>
        <Avatar name={user.username} size={40} online={isOnline} />
        <View style={s.info}>
          <Text style={s.name}>{user.username}</Text>
          <Text style={[s.status, isTyping && { color: TEAL }]}>{statusText}</Text>
        </View>
      </TouchableOpacity>
      <View style={s.actions}>
        <TouchableOpacity style={s.iconBtn} onPress={onVideoCall}>
          <Text style={s.icon}>📹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={onVoiceCall}>
          <Text style={s.icon}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={onInfoPress}>
          <Text style={s.icon}>ℹ️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: SIDEBAR_HEADER, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: DARK },
  status: { fontSize: 12, color: '#8696A0' },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8, borderRadius: 20 },
  icon: { fontSize: 20 },
});
