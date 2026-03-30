import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from './api';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, RED, GREEN } from './theme';
import { Avatar } from './Common';

export default function FriendRequests({ token, userId, onBack, onSelectChat, onlineUsers }) {
  const [tab, setTab] = useState('received'); // received | sent
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [flash, setFlash] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/contacts/pending', token);
      setPending(data.pending || []);
    } catch {} finally { setLoading(false); }
  };

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2500); };

  const acceptRequest = async (contactId) => {
    setActionLoading(contactId);
    try {
      const data = await api(`/contacts/${contactId}/accept`, token, { method: 'PUT' });
      if (data.success) { showFlash('Friend request accepted! 🎉'); load(); }
      else showFlash(data.error || 'Failed');
    } catch { showFlash('Error'); } finally { setActionLoading(null); }
  };

  const declineRequest = async (contactId) => {
    setActionLoading(contactId);
    try {
      await api(`/contacts/${contactId}/decline`, token, { method: 'PUT' });
      showFlash('Request declined'); load();
    } catch { showFlash('Error'); } finally { setActionLoading(null); }
  };

  const cancelRequest = async (contactId) => {
    setActionLoading(contactId);
    try {
      await api(`/contacts/${contactId}`, token, { method: 'DELETE' });
      showFlash('Request cancelled'); load();
    } catch { showFlash('Error'); } finally { setActionLoading(null); }
  };

  const deleteContact = async (contactId) => {
    setActionLoading(contactId);
    try {
      await api(`/contacts/${contactId}`, token, { method: 'DELETE' });
      showFlash('Contact removed'); load();
    } catch { showFlash('Error'); } finally { setActionLoading(null); }
  };

  const received = pending.filter(p => p.receiverId === userId && p.status === 'pending');
  const sent = pending.filter(p => p.requesterId === userId && p.status === 'pending');

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Friend Requests</Text>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'received' && s.tabActive]} onPress={() => setTab('received')}>
          <Text style={[s.tabText, tab === 'received' && s.tabTextActive]}>
            Received {received.length > 0 ? `(${received.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'sent' && s.tabActive]} onPress={() => setTab('sent')}>
          <Text style={[s.tabText, tab === 'sent' && s.tabTextActive]}>
            Sent {sent.length > 0 ? `(${sent.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {flash ? <View style={s.flashBar}><Text style={s.flashText}>{flash}</Text></View> : null}

      <ScrollView style={s.list}>
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={TEAL} /> :
          tab === 'received' ? (
            received.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 48 }}>📬</Text>
                <Text style={s.emptyTitle}>No incoming requests</Text>
                <Text style={s.emptyDesc}>When someone sends you a friend request, it will appear here</Text>
              </View>
            ) : received.map(req => {
              const user = req.requester;
              if (!user) return null;
              const isLoading = actionLoading === req.id;
              return (
                <View key={req.id} style={s.requestCard}>
                  <View style={s.requestTop}>
                    <Avatar name={user.username} size={50} online={onlineUsers?.has(user.id)} />
                    <View style={s.requestInfo}>
                      <Text style={s.requestName}>{user.username}</Text>
                      <Text style={s.requestAbout} numberOfLines={1}>{user.about || 'Hey there! I am using Voice 4U'}</Text>
                      {user.language && <Text style={s.requestLang}>🌐 {user.language}</Text>}
                    </View>
                  </View>
                  <View style={s.requestActions}>
                    <TouchableOpacity style={s.acceptBtn} onPress={() => acceptRequest(req.id)} disabled={isLoading}>
                      <Text style={s.acceptText}>{isLoading ? '...' : '✓ Accept'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.declineBtn} onPress={() => declineRequest(req.id)} disabled={isLoading}>
                      <Text style={s.declineText}>{isLoading ? '...' : '✕ Decline'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => deleteContact(req.id)} disabled={isLoading}>
                      <Text style={s.deleteText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            sent.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 48 }}>📤</Text>
                <Text style={s.emptyTitle}>No sent requests</Text>
                <Text style={s.emptyDesc}>Requests you send will appear here until accepted</Text>
              </View>
            ) : sent.map(req => {
              const user = req.receiver;
              if (!user) return null;
              const isLoading = actionLoading === req.id;
              return (
                <View key={req.id} style={s.requestCard}>
                  <View style={s.requestTop}>
                    <Avatar name={user.username} size={50} online={onlineUsers?.has(user.id)} />
                    <View style={s.requestInfo}>
                      <Text style={s.requestName}>{user.username}</Text>
                      <Text style={s.requestAbout} numberOfLines={1}>{user.about || 'Hey there! I am using Voice 4U'}</Text>
                    </View>
                  </View>
                  <View style={s.requestActions}>
                    <View style={s.pendingBadge}><Text style={s.pendingText}>⏳ Pending</Text></View>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => cancelRequest(req.id)} disabled={isLoading}>
                      <Text style={s.cancelText}>{isLoading ? '...' : 'Cancel Request'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        }
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
  tabs: { flexDirection: 'row', backgroundColor: SIDEBAR_HEADER, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: TEAL },
  tabText: { fontSize: 14, color: '#999', fontWeight: '500' },
  tabTextActive: { color: TEAL, fontWeight: '700' },
  flashBar: { backgroundColor: '#E8F5E9', paddingVertical: 8, paddingHorizontal: 16 },
  flashText: { color: TEAL, fontSize: 13, textAlign: 'center', fontWeight: '500' },
  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center', lineHeight: 20 },
  requestCard: { marginHorizontal: 12, marginTop: 12, backgroundColor: WHITE, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  requestTop: { flexDirection: 'row', alignItems: 'center' },
  requestInfo: { flex: 1, marginLeft: 12 },
  requestName: { fontSize: 16, fontWeight: '700', color: DARK },
  requestAbout: { fontSize: 13, color: '#888', marginTop: 2 },
  requestLang: { fontSize: 12, color: TEAL, marginTop: 3 },
  requestActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: TEAL, borderRadius: 20, paddingVertical: 9, alignItems: 'center' },
  acceptText: { color: WHITE, fontWeight: '600', fontSize: 14 },
  declineBtn: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  declineText: { color: '#666', fontWeight: '600', fontSize: 14 },
  deleteBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 16 },
  pendingBadge: { flex: 1, backgroundColor: '#FFF8E1', borderRadius: 20, paddingVertical: 9, alignItems: 'center' },
  pendingText: { color: '#F9A825', fontWeight: '600', fontSize: 14 },
  cancelBtn: { backgroundColor: '#FFF0F0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  cancelText: { color: RED, fontWeight: '600', fontSize: 13 },
});
