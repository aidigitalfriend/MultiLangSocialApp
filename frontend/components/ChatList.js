import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Avatar, Badge, formatTime } from './Common';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, GRAY, LIGHT_GRAY } from './theme';

export default function ChatList({ users, messages, userId, selectedUser, searchQuery, onSearchChange, onSelectUser, onlineUsers }) {
  const getLastMessage = (user) => {
    const convMsgs = messages.filter(m =>
      (m.senderId === userId && m.receiverId === user.id) ||
      (m.senderId === user.id && m.receiverId === userId));
    if (convMsgs.length === 0) return null;
    return convMsgs[convMsgs.length - 1];
  };

  const getUnreadCount = (user) => {
    return messages.filter(m => m.senderId === user.id && m.receiverId === userId && m.status !== 'read').length;
  };

  // Sort users by last message time (most recent first), users with no messages at the bottom
  const sortedUsers = [...users].sort((a, b) => {
    const lastA = getLastMessage(a);
    const lastB = getLastMessage(b);
    if (!lastA && !lastB) return 0;
    if (!lastA) return 1;
    if (!lastB) return -1;
    return new Date(lastB.createdAt) - new Date(lastA.createdAt);
  });

  const filtered = searchQuery.trim()
    ? sortedUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedUsers;

  return (
    <View style={s.container}>
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search or start new chat"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        style={s.list}
        renderItem={({ item }) => {
          const lastMsg = getLastMessage(item);
          const isActive = selectedUser && selectedUser.id === item.id;
          const unread = getUnreadCount(item);
          const isOnline = onlineUsers.has(item.id);
          return (
            <TouchableOpacity style={[s.row, isActive && s.rowActive]} onPress={() => onSelectUser(item)}>
              <Avatar name={item.username} size={48} online={isOnline} />
              <View style={s.info}>
                <View style={s.top}>
                  <Text style={s.name} numberOfLines={1}>{item.username}</Text>
                  {lastMsg && <Text style={[s.time, unread > 0 && { color: TEAL }]}>{formatTime(lastMsg.createdAt)}</Text>}
                </View>
                <View style={s.bottom}>
                  <Text style={[s.preview, unread > 0 && { color: DARK, fontWeight: '500' }]} numberOfLines={1}>
                    {lastMsg ? (lastMsg.senderId === userId ? `You: ${lastMsg.content}` : lastMsg.content) : (item.language ? `Speaks ${item.language}` : 'Tap to chat')}
                  </Text>
                  {unread > 0 && <Badge count={unread} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💬</Text>
            <Text style={s.emptyTitle}>No conversations yet</Text>
            <Text style={s.emptyDesc}>Go to Contacts tab to add friends and start chatting</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  searchWrap: { padding: 8, backgroundColor: SIDEBAR_HEADER },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  searchIcon: { fontSize: 14, marginRight: 10, color: '#999' },
  searchInput: { flex: 1, fontSize: 14, color: DARK, outlineStyle: 'none', paddingVertical: 4 },
  list: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: LIGHT_GRAY, gap: 12 },
  rowActive: { backgroundColor: '#F0F2F5' },
  info: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '500', color: DARK, flex: 1 },
  time: { fontSize: 11, color: '#999', marginLeft: 8 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: { fontSize: 13, color: GRAY, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: GRAY, textAlign: 'center', paddingHorizontal: 20 },
});
