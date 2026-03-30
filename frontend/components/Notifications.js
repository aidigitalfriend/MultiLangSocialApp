import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from './api';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, RED, GREEN } from './theme';
import { Avatar, formatTime } from './Common';

export default function Notifications({ token, userId, onBack, onSelectChat, onFriendRequests, onlineUsers }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/notifications', token);
      setNotifications(data.notifications || []);
    } catch {} finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await api(`/notifications/${id}/read`, token, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api('/notifications/read-all', token, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await api('/notifications', token, { method: 'DELETE' });
      setNotifications([]);
    } catch {}
  };

  const handlePress = (notif) => {
    if (!notif.read) markRead(notif.id);
    if (notif.type === 'friend_request') {
      onFriendRequests && onFriendRequests();
    } else if (notif.type === 'message' && notif.fromUser) {
      onSelectChat && onSelectChat(notif.fromUser);
    } else if (notif.type === 'missed_call' && notif.fromUser) {
      onSelectChat && onSelectChat(notif.fromUser);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'friend_request': return '👤';
      case 'friend_accepted': return '🤝';
      case 'message': return '💬';
      case 'missed_call': return '📞';
      case 'group_invite': return '👥';
      default: return '🔔';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'friend_request': return '#2196F3';
      case 'friend_accepted': return GREEN;
      case 'missed_call': return RED;
      default: return TEAL;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadText}>{unreadCount}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {notifications.length > 0 && (
          <View style={s.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead} style={s.headerBtn}>
                <Text style={s.headerBtnText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} style={s.headerBtn}>
              <Text style={[s.headerBtnText, { color: RED }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={s.list}>
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={TEAL} /> :
         notifications.length === 0 ? (
           <View style={s.empty}>
             <Text style={{ fontSize: 48 }}>🔔</Text>
             <Text style={s.emptyTitle}>No notifications</Text>
             <Text style={s.emptyDesc}>You're all caught up!</Text>
           </View>
         ) : notifications.map(notif => (
           <TouchableOpacity
             key={notif.id}
             style={[s.notifRow, !notif.read && s.notifUnread]}
             onPress={() => handlePress(notif)}
           >
             <View style={[s.iconWrap, { backgroundColor: getColor(notif.type) + '20' }]}>
               <Text style={s.icon}>{getIcon(notif.type)}</Text>
             </View>
             <View style={s.notifContent}>
               <Text style={[s.notifText, !notif.read && { fontWeight: '700' }]}>{notif.text}</Text>
               <Text style={s.notifTime}>{formatTime(notif.createdAt)}</Text>
             </View>
             {!notif.read && <View style={s.unreadDot} />}
           </TouchableOpacity>
         ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: SIDEBAR_HEADER, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: DARK, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '600', color: DARK, marginLeft: 12 },
  unreadBadge: { backgroundColor: RED, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8 },
  unreadText: { color: WHITE, fontSize: 11, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  headerBtnText: { fontSize: 12, color: TEAL, fontWeight: '600' },
  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#999', marginTop: 6 },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  notifUnread: { backgroundColor: '#F0F9F8' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  notifContent: { flex: 1, marginLeft: 12 },
  notifText: { fontSize: 14, color: DARK, lineHeight: 20 },
  notifTime: { fontSize: 12, color: '#999', marginTop: 3 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: TEAL },
});
