import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from './api';
import { TEAL, TEAL_DARK, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, RED, GREEN } from './theme';
import { Avatar } from './Common';

export default function ContactList({ token, userId, onSelectChat, onlineUsers }) {
  const [tab, setTab] = useState('friends');  // friends | pending | search
  const [contacts, setContacts] = useState([]);
  const [pending, setPending] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { loadContacts(); loadPending(); }, []);

  const loadContacts = async () => {
    try {
      const data = await api('/contacts', token);
      setContacts(data.contacts || []);
    } catch {} finally { setLoading(false); }
  };

  const loadPending = async () => {
    try {
      const data = await api('/contacts/pending', token);
      setPending(data.pending || []);
    } catch {}
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await api(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`, token);
      setSearchResults(data.users || []);
    } catch {} finally { setSearching(false); }
  };

  const sendRequest = async (receiverId) => {
    try {
      const data = await api('/contacts/request', token, { method: 'POST', body: JSON.stringify({ receiverId }) });
      if (data.success) { flash('Request sent!'); setSearchResults(prev => prev.map(u => u.id === receiverId ? { ...u, requestSent: true } : u)); }
      else flash(data.error || 'Failed');
    } catch { flash('Error sending request'); }
  };

  const acceptRequest = async (contactId) => {
    try {
      const data = await api(`/contacts/${contactId}/accept`, token, { method: 'PUT' });
      if (data.success) { flash('Accepted!'); loadContacts(); loadPending(); }
    } catch { flash('Error'); }
  };

  const rejectRequest = async (contactId) => {
    try {
      await api(`/contacts/${contactId}`, token, { method: 'DELETE' });
      flash('Rejected'); loadPending();
    } catch { flash('Error'); }
  };

  const blockContact = async (contactId) => {
    try {
      const data = await api(`/contacts/${contactId}/block`, token, { method: 'PUT' });
      if (data.success) { flash('Blocked'); loadContacts(); loadPending(); }
    } catch { flash('Error'); }
  };

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 2000); };

  const incomingPending = pending.filter(p => p.receiverId === userId);
  const outgoingPending = pending.filter(p => p.requesterId === userId);

  return (
    <View style={s.container}>
      {/* Tabs */}
      <View style={s.tabs}>
        {[['friends', `Friends (${contacts.length})`], ['pending', `Pending (${incomingPending.length})`], ['search', '🔍 Find']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key)}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {actionMsg ? <View style={s.flash}><Text style={s.flashText}>{actionMsg}</Text></View> : null}

      <ScrollView style={s.list}>
        {/* FRIENDS TAB */}
        {tab === 'friends' && (
          loading ? <ActivityIndicator style={{ marginTop: 40 }} color={TEAL} /> :
          contacts.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>👥</Text>
              <Text style={s.emptyTitle}>No contacts yet</Text>
              <Text style={s.emptyDesc}>Search for people to add as friends</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setTab('search')}><Text style={s.emptyBtnText}>Find Friends</Text></TouchableOpacity>
            </View>
          ) : contacts.map(c => {
            const friend = c.requesterId === userId ? c.receiver : c.requester;
            if (!friend) return null;
            const online = onlineUsers && onlineUsers.has(friend.id);
            return (
              <TouchableOpacity key={c.id} style={s.contactRow} onPress={() => onSelectChat(friend)}>
                <Avatar name={friend.username} size={46} online={online} />
                <View style={s.contactInfo}>
                  <Text style={s.contactName}>{friend.username}</Text>
                  <Text style={s.contactAbout} numberOfLines={1}>{friend.about || 'Hey there! I am using Voice 4U'}</Text>
                </View>
                <TouchableOpacity style={s.msgBtn} onPress={() => onSelectChat(friend)}>
                  <Text style={s.msgBtnText}>💬</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* PENDING TAB */}
        {tab === 'pending' && (
          <View>
            {incomingPending.length > 0 && (
              <View>
                <Text style={s.subHead}>Incoming Requests</Text>
                {incomingPending.map(p => (
                  <View key={p.id} style={s.contactRow}>
                    <Avatar name={p.requester?.username || '?'} size={46} />
                    <View style={s.contactInfo}>
                      <Text style={s.contactName}>{p.requester?.username || 'Unknown'}</Text>
                      <Text style={s.contactAbout}>Wants to connect</Text>
                    </View>
                    <TouchableOpacity style={s.acceptBtn} onPress={() => acceptRequest(p.id)}><Text style={s.acceptText}>Accept</Text></TouchableOpacity>
                    <TouchableOpacity style={s.rejectBtn} onPress={() => rejectRequest(p.id)}><Text style={s.rejectText}>✕</Text></TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {outgoingPending.length > 0 && (
              <View>
                <Text style={s.subHead}>Sent Requests</Text>
                {outgoingPending.map(p => (
                  <View key={p.id} style={s.contactRow}>
                    <Avatar name={p.receiver?.username || '?'} size={46} />
                    <View style={s.contactInfo}>
                      <Text style={s.contactName}>{p.receiver?.username || 'Unknown'}</Text>
                      <Text style={[s.contactAbout, { color: '#F9A825' }]}>Pending...</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {incomingPending.length === 0 && outgoingPending.length === 0 && (
              <View style={s.empty}>
                <Text style={{ fontSize: 48 }}>📭</Text>
                <Text style={s.emptyTitle}>No pending requests</Text>
              </View>
            )}
          </View>
        )}

        {/* SEARCH TAB */}
        {tab === 'search' && (
          <View>
            <View style={s.searchWrap}>
              <TextInput
                style={s.searchInput}
                placeholder="Search by username or email..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchUsers}
                returnKeyType="search"
              />
              <TouchableOpacity style={s.searchBtn} onPress={searchUsers}><Text style={s.searchBtnText}>Search</Text></TouchableOpacity>
            </View>
            {searching ? <ActivityIndicator style={{ marginTop: 30 }} color={TEAL} /> :
              searchResults.length === 0 ? (
                searchQuery.trim() ? <Text style={s.noResults}>No users found</Text> :
                <View style={s.empty}>
                  <Text style={{ fontSize: 48 }}>🔍</Text>
                  <Text style={s.emptyTitle}>Find Friends</Text>
                  <Text style={s.emptyDesc}>Search by username or email to connect</Text>
                </View>
              ) : searchResults.map(u => {
                const isMe = u.id === userId;
                const isFriend = contacts.some(c => c.requesterId === u.id || c.receiverId === u.id);
                const isPending = pending.some(p => p.requesterId === u.id || p.receiverId === u.id);
                return (
                  <View key={u.id} style={s.contactRow}>
                    <Avatar name={u.username} size={46} />
                    <View style={s.contactInfo}>
                      <Text style={s.contactName}>{u.username}</Text>
                      <Text style={s.contactAbout}>{u.about || ''}</Text>
                    </View>
                    {isMe ? <Text style={s.youBadge}>You</Text> :
                     isFriend ? <Text style={s.friendBadge}>✓ Friends</Text> :
                     isPending || u.requestSent ? <Text style={s.pendingBadge}>Pending</Text> :
                     <TouchableOpacity style={s.addBtn} onPress={() => sendRequest(u.id)}><Text style={s.addBtnText}>+ Add</Text></TouchableOpacity>
                    }
                  </View>
                );
              })
            }
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  tabs: { flexDirection: 'row', backgroundColor: SIDEBAR_HEADER, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: TEAL },
  tabText: { fontSize: 13, color: '#999', fontWeight: '500' },
  tabTextActive: { color: TEAL, fontWeight: '700' },
  list: { flex: 1 },
  flash: { backgroundColor: '#E8F5E9', paddingVertical: 8, paddingHorizontal: 16 },
  flashText: { color: TEAL, fontSize: 13, textAlign: 'center', fontWeight: '500' },
  subHead: { fontSize: 13, fontWeight: '700', color: TEAL, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, letterSpacing: 0.5 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 15, fontWeight: '600', color: DARK },
  contactAbout: { fontSize: 13, color: '#888', marginTop: 2 },
  msgBtn: { padding: 8 },
  msgBtnText: { fontSize: 20 },
  acceptBtn: { backgroundColor: TEAL, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6, marginRight: 8 },
  acceptText: { color: WHITE, fontSize: 13, fontWeight: '600' },
  rejectBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  rejectText: { fontSize: 14, color: '#999' },
  addBtn: { backgroundColor: TEAL, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6 },
  addBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },
  youBadge: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  friendBadge: { fontSize: 12, color: TEAL, fontWeight: '600' },
  pendingBadge: { fontSize: 12, color: '#F9A825', fontWeight: '500' },
  searchWrap: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: DARK, outlineStyle: 'none' },
  searchBtn: { backgroundColor: TEAL, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },
  noResults: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#999', marginTop: 6 },
  emptyBtn: { backgroundColor: TEAL, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 10, marginTop: 18 },
  emptyBtnText: { color: WHITE, fontWeight: '600', fontSize: 14 },
});
