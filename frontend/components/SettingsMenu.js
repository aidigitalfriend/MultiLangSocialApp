import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Avatar } from './Common';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, RED } from './theme';

export default function SettingsMenu({ profile, language, hasVoiceSample, onBack, onAccount, onLanguage, onLogout }) {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
      </View>
      <ScrollView style={s.content}>
        <View style={s.profileSummary}>
          <Avatar name={profile.username} size={70} />
          <Text style={s.profileName}>{profile.username}</Text>
          <Text style={s.profileEmail}>{profile.email}</Text>
          {profile.about && <Text style={s.profileAbout}>{profile.about}</Text>}
        </View>

        <TouchableOpacity style={s.menuItem} onPress={onAccount}>
          <Text style={s.menuIcon}>👤</Text>
          <View style={s.menuInfo}>
            <Text style={s.menuTitle}>Account</Text>
            <Text style={s.menuDesc}>Username, email, about</Text>
          </View>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.menuItem} onPress={onLanguage}>
          <Text style={s.menuIcon}>🌐</Text>
          <View style={s.menuInfo}>
            <Text style={s.menuTitle}>Language & Voice</Text>
            <Text style={s.menuDesc}>{language || 'Set your language'}{hasVoiceSample ? ' · Voice recorded' : ''}</Text>
          </View>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={s.divider} />

        <TouchableOpacity style={s.menuItem} onPress={onLogout}>
          <Text style={s.menuIcon}>🚪</Text>
          <View style={s.menuInfo}>
            <Text style={[s.menuTitle, { color: RED }]}>Log Out</Text>
          </View>
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
  profileSummary: { alignItems: 'center', paddingVertical: 24, backgroundColor: SIDEBAR_HEADER, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  profileName: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 10 },
  profileEmail: { fontSize: 13, color: '#888', marginTop: 2 },
  profileAbout: { fontSize: 13, color: '#666', marginTop: 4, fontStyle: 'italic' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  menuIcon: { fontSize: 20, marginRight: 16 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 16, color: DARK, fontWeight: '500' },
  menuDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  menuArrow: { fontSize: 22, color: '#CCC' },
  divider: { height: 8, backgroundColor: SIDEBAR_HEADER },
});
