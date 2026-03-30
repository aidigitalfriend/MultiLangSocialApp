import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TEAL = '#00897B';
const TEAL_DARK = '#00695C';
const WHITE = '#FFFFFF';
const DARK = '#1A1A2E';
const BG = '#F5F5F5';

export default function SettingsScreen({ route, navigation }) {
  const { token } = route.params;

  const handleLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🌐</Text>
          <Text style={styles.menuText}>Language</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuText}>Privacy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuText, { color: '#E53935' }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: TEAL_DARK, paddingHorizontal: 12, paddingVertical: 14 },
  backBtn: { padding: 8 },
  backArrow: { color: WHITE, fontSize: 22, fontWeight: '700' },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '600', marginLeft: 8 },
  content: { flex: 1, paddingTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  menuIcon: { fontSize: 20, marginRight: 16 },
  menuText: { fontSize: 16, color: DARK },
  logoutItem: { marginTop: 20 },
});