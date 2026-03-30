import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { CHAT_BG } from './theme';

export default function ChatPanel({ user, messages, userId, onSend, onDelete, onReply, replyTo, onCancelReply, onTyping, onVoiceCall, onVideoCall, onInfoPress, onlineUsers, typingUsers, onSendMedia }) {
  const flatListRef = useRef(null);
  const isTyping = typingUsers && typingUsers.has(user.id);

  return (
    <View style={s.container}>
      <ChatHeader
        user={user}
        isTyping={isTyping}
        onlineUsers={onlineUsers}
        onVoiceCall={() => onVoiceCall(user)}
        onVideoCall={() => onVideoCall(user)}
        onInfoPress={() => onInfoPress(user)}
      />
      <View style={s.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isSent={item.senderId === userId}
              userId={userId}
              onDelete={onDelete}
              onReply={onReply}
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No messages yet. Say hello! 👋</Text>
            </View>
          }
        />
      </View>
      <MessageInput
        onSend={onSend}
        onTyping={onTyping}
        replyTo={replyTo}
        onCancelReply={onCancelReply}
        onSendMedia={onSendMedia}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column' },
  chatArea: { flex: 1, backgroundColor: CHAT_BG },
  list: { paddingVertical: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: '#8696A0' },
});
