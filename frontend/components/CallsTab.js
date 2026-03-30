import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from './api';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, RED, GREEN } from './theme';
import { Avatar, formatTime, formatCallDuration } from './Common';

export default function CallsTab({ token, userId, onlineUsers, onSelectChat }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | missed | incoming | outgoing

  useEffect(() => { loadCalls(); }, []);

  const loadCalls = async () => {
    try {
      const data = await api('/calls', token);
      setCalls(data.calls || []);
    } catch {} finally { setLoading(false); }
  };

  const getCallIcon = (call) => {
    if (call.status === 'missed') return { icon: '↙️', color: RED, label: 'Missed' };
    if (call.callerId === userId) return { icon: '↗️', color: GREEN, label: 'Outgoing' };
    return { icon: '↙️', color: GREEN, label: 'Incoming' };
  };

  const filtered = calls.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'missed') return c.status === 'missed';
    if (filter === 'incoming') return c.receiverId === userId && c.status !== 'missed';
    if (filter === 'outgoing') return c.callerId === userId;
    return true;
  });

  const missedCount = calls.filter(c => c.status === 'missed' && c.receiverId === userId).length;

  return (
    <View style={s.container}>
      {/* Filter tabs */}
      <View style={s.filters}>
        {[['all', 'All'], ['missed', `Missed${missedCount ? ` (${missedCount})` : ''}`], ['incoming', 'Incoming'], ['outgoing', 'Outgoing']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.filterBtn, filter === key && s.filterActive]} onPress={() => setFilter(key)}>
            <Text style={[s.filterText, filter === key && s.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.list}>
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={TEAL} /> :
         filtered.length === 0 ? (
           <View style={s.empty}>
             <Text style={{ fontSize: 48 }}>📞</Text>
             <Text style={s.emptyTitle}>{filter === 'all' ? 'No calls yet' : `No ${filter} calls`}</Text>
             <Text style={s.emptyDesc}>Call history will appear here</Text>
           </View>
         ) : filtered.map(call => {
           const otherUser = call.callerId === userId ? call.receiver : call.caller;
           if (!otherUser) return null;
           const ci = getCallIcon(call);
           const online = onlineUsers && onlineUsers.has(otherUser.id);
           return (
             <TouchableOpacity key={call.id} style={s.callRow} onPress={() => onSelectChat(otherUser)}>
               <Avatar name={otherUser.username} size={46} online={online} />
               <View style={s.callInfo}>
                 <Text style={[s.callName, call.status === 'missed' && { color: RED }]}>{otherUser.username}</Text>
                 <View style={s.callMeta}>
                   <Text style={[s.callDir, { color: ci.color }]}>{ci.icon}</Text>
                   <Text style={s.callLabel}>{ci.label}</Text>
                   {call.duration > 0 && <Text style={s.callDuration}> · {formatCallDuration(call.duration)}</Text>}
                 </View>
               </View>
               <View style={s.callRight}>
                 <Text style={s.callTime}>{formatTime(call.createdAt)}</Text>
                 <View style={s.callActions}>
                   {call.callType === 'video' ? (
                     <TouchableOpacity style={s.callActionBtn}><Text style={s.callActionIcon}>📹</Text></TouchableOpacity>
                   ) : (
                     <TouchableOpacity style={s.callActionBtn}><Text style={s.callActionIcon}>📞</Text></TouchableOpacity>
                   )}
                 </View>
               </View>
             </TouchableOpacity>
           );
         })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  filters: { flexDirection: 'row', backgroundColor: SIDEBAR_HEADER, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: BORDER, flexWrap: 'wrap', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F2F5' },
  filterActive: { backgroundColor: TEAL },
  filterText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterTextActive: { color: WHITE, fontWeight: '600' },
  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#999', marginTop: 6 },
  callRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  callInfo: { flex: 1, marginLeft: 12 },
  callName: { fontSize: 15, fontWeight: '600', color: DARK },
  callMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  callDir: { fontSize: 14, marginRight: 4 },
  callLabel: { fontSize: 13, color: '#888' },
  callDuration: { fontSize: 13, color: '#888' },
  callRight: { alignItems: 'flex-end' },
  callTime: { fontSize: 12, color: '#999' },
  callActions: { marginTop: 6 },
  callActionBtn: { padding: 4 },
  callActionIcon: { fontSize: 18 },
});
