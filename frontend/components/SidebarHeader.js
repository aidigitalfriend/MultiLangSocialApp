import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TEAL, DARK, WHITE, SIDEBAR_HEADER, BORDER } from './theme';

export default function SidebarHeader({ activeTab, onTabChange, onSettingsPress, onNewChat, unreadCount }) {
  const tabs = [
    { key: 'chats', label: '💬', title: 'Chats' },
    { key: 'contacts', label: '👥', title: 'Contacts' },
    { key: 'calls', label: '📞', title: 'Calls' },
  ];

  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <Text style={s.title}>Voice 4U</Text>
        <View style={s.actions}>
          <TouchableOpacity onPress={onNewChat} style={s.iconBtn}>
            <Text style={s.icon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSettingsPress} style={s.iconBtn}>
            <Text style={s.icon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.title}</Text>
            {tab.key === 'chats' && unreadCount > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unreadCount}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: SIDEBAR_HEADER, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: DARK, flex: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 20 },
  icon: { fontSize: 20 },
  tabs: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent', gap: 6 },
  tabActive: { borderBottomColor: TEAL },
  tabLabel: { fontSize: 16 },
  tabLabelActive: {},
  tabText: { fontSize: 13, color: '#999', fontWeight: '500' },
  tabTextActive: { color: TEAL, fontWeight: '600' },
  badge: { backgroundColor: TEAL, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, marginLeft: 4 },
  badgeText: { color: WHITE, fontSize: 10, fontWeight: '700' },
});
