import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import io from 'socket.io-client';

const TEAL = '#00897B';
const TEAL_DARK = '#00695C';
const WHITE = '#FFFFFF';
const DARK = '#1A1A2E';
const BG = '#ECE5DD';
const CHAT_BG = '#E5DDD5';
const SENT_BUBBLE = '#DCF8C6';
const RECEIVED_BUBBLE = '#FFFFFF';

export default function ChatScreen({ route, navigation }) {
  const { userId, token } = route.params;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showContacts, setShowContacts] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    const newSocket = io('https://api.v4u.ai');
    setSocket(newSocket);
    newSocket.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    fetch('https://api.v4u.ai/messages', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()).then(data => {
      if (Array.isArray(data)) setMessages(data);
    });

    fetch('https://api.v4u.ai/users', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()).then(data => {
      if (Array.isArray(data)) setUsers(data.filter(u => u.id !== userId));
    });

    return () => newSocket.disconnect();
  }, [token, userId]);

  const sendMessage = () => {
    if (socket && message.trim() && selectedUser) {
      socket.emit('sendMessage', { senderId: userId, receiverId: selectedUser.id, content: message, type: 'text' });
      setMessages(prev => [...prev, {
        id: Date.now(),
        senderId: userId,
        receiverId: selectedUser.id,
        content: message,
        translatedContent: message,
        createdAt: new Date().toISOString(),
      }]);
      setMessage('');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitial = (name) => (name || '?')[0].toUpperCase();

  const chatMessages = selectedUser
    ? messages.filter(m =>
        (m.senderId === userId && m.receiverId === selectedUser.id) ||
        (m.senderId === selectedUser.id && m.receiverId === userId))
    : [];

  // Contact list view
  if (showContacts || !selectedUser) {
    return (
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Voice 4U</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings', { token })} style={styles.headerIconBtn}>
              <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search or start new chat</Text>
        </View>

        {/* Contact list */}
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.contactRow} onPress={() => { setSelectedUser(item); setShowContacts(false); }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial(item.username)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.username}</Text>
                <Text style={styles.contactLang}>{item.language ? `Speaks ${item.language}` : 'Tap to chat'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyDesc}>When other users join, they'll appear here</Text>
            </View>
          }
        />
      </View>
    );
  }

  // Chat view
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Chat header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setShowContacts(true)} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>{getInitial(selectedUser.username)}</Text>
        </View>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{selectedUser.username}</Text>
          <Text style={styles.chatHeaderStatus}>{selectedUser.language || 'online'}</Text>
        </View>
        <View style={styles.chatHeaderActions}>
          <TouchableOpacity style={styles.headerIconBtn}><Text style={styles.headerIcon}>📞</Text></TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}><Text style={styles.headerIcon}>📹</Text></TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id.toString()}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const isSent = item.senderId === userId;
            return (
              <View style={[styles.bubbleRow, isSent ? styles.bubbleRowSent : styles.bubbleRowReceived]}>
                <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
                  <Text style={styles.bubbleText}>{isSent ? item.content : (item.translatedContent || item.content)}</Text>
                  {!isSent && item.translatedContent && item.translatedContent !== item.content && (
                    <Text style={styles.originalText}>Original: {item.content}</Text>
                  )}
                  <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.chatEmpty}>
              <Text style={styles.chatEmptyText}>No messages yet. Say hello! 👋</Text>
            </View>
          }
        />
      </View>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn}>
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message"
          value={message}
          onChangeText={setMessage}
          multiline
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.micBtn}>
          <Text style={styles.micIcon}>🎤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sendBtn, !message.trim() && { opacity: 0.4 }]} onPress={sendMessage} disabled={!message.trim()}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  // Contact List Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: TEAL_DARK, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { color: WHITE, fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerIconBtn: { padding: 4 },
  headerIcon: { fontSize: 20 },
  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, margin: 8, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchPlaceholder: { color: '#999', fontSize: 15 },
  // Contacts
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: WHITE, fontSize: 20, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600', color: DARK },
  contactLang: { fontSize: 13, color: '#888', marginTop: 2 },
  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#888' },
  // Chat Header
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: TEAL_DARK, paddingHorizontal: 8, paddingVertical: 10 },
  backBtn: { padding: 8 },
  backArrow: { color: WHITE, fontSize: 22, fontWeight: '700' },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#4DB6AC', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarSmallText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { color: WHITE, fontSize: 16, fontWeight: '600' },
  chatHeaderStatus: { color: '#B2DFDB', fontSize: 12 },
  chatHeaderActions: { flexDirection: 'row', gap: 8 },
  // Chat Area
  chatArea: { flex: 1, backgroundColor: CHAT_BG },
  messagesList: { paddingHorizontal: 10, paddingVertical: 10 },
  bubbleRow: { marginBottom: 4 },
  bubbleRowSent: { alignItems: 'flex-end' },
  bubbleRowReceived: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 14 },
  bubbleSent: { backgroundColor: SENT_BUBBLE, borderTopRightRadius: 4 },
  bubbleReceived: { backgroundColor: RECEIVED_BUBBLE, borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: DARK, lineHeight: 20 },
  originalText: { fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 4 },
  timeText: { fontSize: 10, color: '#999', position: 'absolute', bottom: 2, right: 8 },
  chatEmpty: { alignItems: 'center', paddingTop: 60 },
  chatEmptyText: { fontSize: 14, color: '#888' },
  // Input Bar
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: BG, paddingHorizontal: 6, paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: '#CCC' },
  attachBtn: { padding: 8 },
  attachIcon: { fontSize: 22 },
  textInput: { flex: 1, backgroundColor: WHITE, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, marginHorizontal: 4 },
  micBtn: { padding: 8 },
  micIcon: { fontSize: 22 },
  sendBtn: { backgroundColor: TEAL, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: WHITE, fontSize: 18 },
});