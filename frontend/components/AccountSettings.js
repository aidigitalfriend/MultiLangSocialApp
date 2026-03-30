import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from './Common';
import { api } from './api';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER } from './theme';

export default function AccountSettings({ profile, token, onBack, onProfileUpdate }) {
  const [username, setUsername] = useState(profile.username || '');
  const [email, setEmail] = useState(profile.email || '');
  const [about, setAbout] = useState(profile.about || '');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setMsg('');
    try {
      const data = await api('/profile', token, {
        method: 'PUT',
        body: JSON.stringify({ username: username.trim(), email: email.trim(), about: about.trim() }),
      });
      if (data.success) {
        setMsg('Profile updated');
        onProfileUpdate({ username: username.trim(), email: email.trim(), about: about.trim() });
      } else {
        setMsg(data.error || 'Failed to update');
      }
    } catch { setMsg('Network error'); }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Account</Text>
      </View>
      <ScrollView style={s.content}>
        <View style={s.avatarWrap}>
          <Avatar name={profile.username} size={90} />
        </View>

        <View style={s.field}>
          <Text style={s.label}>USERNAME</Text>
          <TextInput style={s.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        </View>

        <View style={s.field}>
          <Text style={s.label}>EMAIL</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={s.field}>
          <Text style={s.label}>ABOUT</Text>
          <TextInput style={s.input} value={about} onChangeText={setAbout} maxLength={140} />
          <Text style={s.charCount}>{about.length}/140</Text>
        </View>

        {msg ? <Text style={[s.msg, msg === 'Profile updated' && { color: TEAL }]}>{msg}</Text> : null}

        <TouchableOpacity style={s.saveBtn} onPress={save}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
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
  content: { flex: 1 },
  avatarWrap: { alignItems: 'center', paddingVertical: 30, backgroundColor: SIDEBAR_HEADER },
  field: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 12, color: TEAL, fontWeight: '600', marginBottom: 6 },
  input: { fontSize: 16, color: DARK, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER, outlineStyle: 'none' },
  charCount: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 4 },
  msg: { textAlign: 'center', fontSize: 13, color: '#E53935', marginTop: 12 },
  saveBtn: { backgroundColor: TEAL, marginHorizontal: 20, marginTop: 20, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: WHITE, fontSize: 16, fontWeight: '600' },
});
