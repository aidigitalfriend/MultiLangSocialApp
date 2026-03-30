import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyPanel() {
  return (
    <View style={s.container}>
      <View style={s.content}>
        <Text style={s.icon}>💬</Text>
        <Text style={s.title}>Voice 4U Web</Text>
        <Text style={s.desc}>Send and receive messages in any language.{'\n'}Select a chat to start messaging.</Text>
        <View style={s.divider} />
        <Text style={s.footer}>🔒 End-to-end encrypted</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', maxWidth: 500 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '300', color: '#41525D', marginBottom: 16 },
  desc: { fontSize: 14, color: '#8696A0', textAlign: 'center', lineHeight: 22 },
  divider: { width: 400, height: 1, backgroundColor: '#E0E0E0', marginVertical: 30 },
  footer: { fontSize: 13, color: '#8696A0' },
});
