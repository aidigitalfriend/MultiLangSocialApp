import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { api } from './api';
import { TEAL, TEAL_DARK, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER } from './theme';
import { Avatar, formatTime } from './Common';

export default function GroupList({ token, userId, contacts, onSelectGroup, onlineUsers }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [memberSearch, setMemberSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try {
      const data = await api('/groups', token);
      setGroups(data.groups || []);
    } catch {} finally { setLoading(false); }
  };

  const createGroup = async () => {
    if (!groupName.trim()) { setError('Group name required'); return; }
    if (selectedMembers.size < 1) { setError('Add at least 1 member'); return; }
    setCreating(true); setError('');
    try {
      const data = await api('/groups', token, {
        method: 'POST',
        body: JSON.stringify({ name: groupName.trim(), description: groupDesc.trim(), memberIds: Array.from(selectedMembers) })
      });
      if (data.group) {
        setGroups(prev => [data.group, ...prev]);
        setShowCreate(false); setGroupName(''); setGroupDesc(''); setSelectedMembers(new Set());
      } else setError(data.error || 'Failed to create group');
    } catch { setError('Error creating group'); } finally { setCreating(false); }
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const friendList = (contacts || []).map(c => c.requesterId === userId ? c.receiver : c.requester).filter(Boolean);
  const filteredFriends = memberSearch.trim()
    ? friendList.filter(f => f.username.toLowerCase().includes(memberSearch.toLowerCase()))
    : friendList;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Groups</Text>
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={s.createBtnText}>+ New Group</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.list}>
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={TEAL} /> :
         groups.length === 0 ? (
           <View style={s.empty}>
             <Text style={{ fontSize: 48 }}>👥</Text>
             <Text style={s.emptyTitle}>No groups yet</Text>
             <Text style={s.emptyDesc}>Create a group to start chatting</Text>
             <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreate(true)}>
               <Text style={s.emptyBtnText}>Create Group</Text>
             </TouchableOpacity>
           </View>
         ) : groups.map(g => {
           const memberCount = g.members ? g.members.length : g.memberCount || 0;
           return (
             <TouchableOpacity key={g.id} style={s.groupRow} onPress={() => onSelectGroup(g)}>
               <View style={s.groupAvatar}>
                 <Text style={s.groupAvatarText}>{g.name.charAt(0).toUpperCase()}</Text>
               </View>
               <View style={s.groupInfo}>
                 <Text style={s.groupName}>{g.name}</Text>
                 <Text style={s.groupMeta} numberOfLines={1}>
                   {g.lastMessage ? g.lastMessage : `${memberCount} members`}
                 </Text>
               </View>
               {g.lastMessageTime && <Text style={s.groupTime}>{formatTime(g.lastMessageTime)}</Text>}
             </TouchableOpacity>
           );
         })}
      </ScrollView>

      {/* Create Group Modal */}
      {showCreate && (
        <View style={s.modal}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => { setShowCreate(false); setError(''); }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>New Group</Text>
              <TouchableOpacity onPress={createGroup} disabled={creating}>
                <Text style={[s.modalCreate, creating && { opacity: 0.4 }]}>{creating ? '...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody}>
              <Text style={s.label}>Group Name</Text>
              <TextInput style={s.input} value={groupName} onChangeText={setGroupName} placeholder="Enter group name" placeholderTextColor="#999" maxLength={50} />

              <Text style={s.label}>Description (optional)</Text>
              <TextInput style={[s.input, { height: 60 }]} value={groupDesc} onChangeText={setGroupDesc} placeholder="What's this group about?" placeholderTextColor="#999" multiline maxLength={200} />

              <Text style={s.label}>Add Members ({selectedMembers.size} selected)</Text>
              {friendList.length === 0 ? (
                <Text style={s.noFriends}>Add friends first to create a group</Text>
              ) : (
                <View>
                  <TextInput style={s.searchInput} value={memberSearch} onChangeText={setMemberSearch} placeholder="Search friends..." placeholderTextColor="#999" />
                  {filteredFriends.map(f => (
                    <TouchableOpacity key={f.id} style={s.memberRow} onPress={() => toggleMember(f.id)}>
                      <View style={[s.checkbox, selectedMembers.has(f.id) && s.checkboxActive]}>
                        {selectedMembers.has(f.id) && <Text style={s.checkmark}>✓</Text>}
                      </View>
                      <Avatar name={f.username} size={36} />
                      <Text style={s.memberName}>{f.username}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {error ? <Text style={s.error}>{error}</Text> : null}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: SIDEBAR_HEADER, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  headerTitle: { fontSize: 16, fontWeight: '700', color: DARK },
  createBtn: { backgroundColor: TEAL, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  createBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },
  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#999', marginTop: 6 },
  emptyBtn: { backgroundColor: TEAL, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 10, marginTop: 18 },
  emptyBtnText: { color: WHITE, fontWeight: '600', fontSize: 14 },
  groupRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  groupAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  groupAvatarText: { color: WHITE, fontSize: 22, fontWeight: '700' },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 15, fontWeight: '600', color: DARK },
  groupMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  groupTime: { fontSize: 12, color: '#999' },
  // Modal
  modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: WHITE, zIndex: 100 },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: SIDEBAR_HEADER, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  modalClose: { fontSize: 20, color: '#666', padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: DARK },
  modalCreate: { fontSize: 15, fontWeight: '700', color: TEAL },
  modalBody: { flex: 1, padding: 16 },
  label: { fontSize: 13, fontWeight: '700', color: TEAL, marginBottom: 6, marginTop: 16, letterSpacing: 0.5 },
  input: { backgroundColor: '#F0F2F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: DARK, outlineStyle: 'none' },
  searchInput: { backgroundColor: '#F0F2F5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: DARK, marginBottom: 8, outlineStyle: 'none' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: TEAL, borderColor: TEAL },
  checkmark: { color: WHITE, fontSize: 14, fontWeight: '700' },
  memberName: { fontSize: 15, color: DARK, fontWeight: '500' },
  noFriends: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
  error: { color: '#F44336', fontSize: 13, textAlign: 'center', marginTop: 12 },
});
