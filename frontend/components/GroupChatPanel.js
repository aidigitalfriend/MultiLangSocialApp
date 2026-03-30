import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput } from 'react-native';
import { TEAL, TEAL_DARK, DARK, WHITE, BG, BORDER, SIDEBAR_HEADER } from './theme';
import { Avatar, formatTime } from './Common';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function GroupChatPanel({ group, messages, userId, members, onSend, onDelete, onReply, replyTo, onCancelReply, onTyping, onInfoPress, onlineUsers, typingUsers, onSendMedia, onBack }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      setTimeout(() => { try { listRef.current.scrollToEnd({ animated: true }); } catch {} }, 100);
    }
  }, [messages.length]);

  const getMemberName = (senderId) => {
    const m = members?.find(m => m.userId === senderId || m.user?.id === senderId);
    return m?.user?.username || m?.username || 'Unknown';
  };

  const typingList = typingUsers ? Array.from(typingUsers).filter(id => id !== userId) : [];
  const typingNames = typingList.map(getMemberName);
  const typingText = typingNames.length === 1 ? `${typingNames[0]} is typing...`
    : typingNames.length > 1 ? `${typingNames.join(', ')} are typing...` : '';

  const memberCount = members?.length || group.memberCount || 0;
  const onlineCount = members ? members.filter(m => onlineUsers && onlineUsers.has(m.userId || m.user?.id)).length : 0;

  const renderMessage = ({ item, index }) => {
    const isSent = item.senderId === userId;
    const senderName = !isSent ? getMemberName(item.senderId) : null;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showSender = !isSent && (!prevMsg || prevMsg.senderId !== item.senderId);

    return (
      <View>
        {showSender && <Text style={s.senderLabel}>{senderName}</Text>}
        <MessageBubble message={item} isSent={isSent} userId={userId} onDelete={onDelete} onReply={onReply} />
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Group Header */}
      <View style={s.header}>
        {onBack && <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>}
        <View style={s.groupAvatar}><Text style={s.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</Text></View>
        <View style={s.headerInfo}>
          <Text style={s.groupName}>{group.name}</Text>
          <Text style={s.groupMeta}>
            {typingText || `${memberCount} members${onlineCount > 0 ? ` · ${onlineCount} online` : ''}`}
          </Text>
        </View>
        <TouchableOpacity style={s.infoBtn} onPress={onInfoPress}><Text style={s.infoBtnText}>ℹ️</Text></TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => String(item.id)}
        renderItem={renderMessage}
        style={s.messages}
        contentContainerStyle={s.messageContent}
        onContentSizeChange={() => { try { listRef.current?.scrollToEnd({ animated: false }); } catch {} }}
      />

      {/* Input */}
      <MessageInput onSend={onSend} onTyping={onTyping} replyTo={replyTo} onCancelReply={onCancelReply} onSendMedia={onSendMedia} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: SIDEBAR_HEADER, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  backBtn: { padding: 4, marginRight: 4 },
  backArrow: { fontSize: 20, color: DARK, fontWeight: '700' },
  groupAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  groupAvatarText: { color: WHITE, fontSize: 18, fontWeight: '700' },
  headerInfo: { flex: 1, marginLeft: 10 },
  groupName: { fontSize: 16, fontWeight: '700', color: DARK },
  groupMeta: { fontSize: 12, color: '#888', marginTop: 1 },
  infoBtn: { padding: 8 },
  infoBtnText: { fontSize: 20 },
  messages: { flex: 1 },
  messageContent: { paddingHorizontal: 12, paddingVertical: 8 },
  senderLabel: { fontSize: 12, fontWeight: '700', color: TEAL, marginLeft: 8, marginTop: 8, marginBottom: 2 },
});
