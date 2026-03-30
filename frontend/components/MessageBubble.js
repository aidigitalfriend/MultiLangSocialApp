import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DARK, SENT_BUBBLE, RECEIVED_BUBBLE, TEAL, RED, WHITE, BORDER } from './theme';

export default function MessageBubble({ message, isSent, userId, onDelete, onReply }) {
  const [showMenu, setShowMenu] = useState(false);

  if (message.deletedForEveryone) {
    return (
      <View style={[s.row, isSent ? s.rowSent : s.rowReceived]}>
        <View style={[s.bubble, s.deletedBubble]}>
          <Text style={s.deletedText}>🚫 This message was deleted</Text>
        </View>
      </View>
    );
  }

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const statusIcon = isSent ? (message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓') : '';
  const statusColor = message.status === 'read' ? '#53BDEB' : '#999';

  return (
    <View style={[s.row, isSent ? s.rowSent : s.rowReceived]}>
      <TouchableOpacity
        style={[s.bubble, isSent ? s.bubbleSent : s.bubbleReceived]}
        onLongPress={() => setShowMenu(true)}
        activeOpacity={0.8}
      >
        {message.replyToContent && (
          <View style={s.replyBox}>
            <Text style={s.replyText} numberOfLines={1}>{message.replyToContent}</Text>
          </View>
        )}
        {message.type === 'image' && message.mediaUrl && (
          <View style={s.mediaBox}>
            <Text style={s.mediaPlaceholder}>🖼️ Image</Text>
          </View>
        )}
        {message.type === 'video' && message.mediaUrl && (
          <View style={s.mediaBox}>
            <Text style={s.mediaPlaceholder}>🎥 Video</Text>
          </View>
        )}
        {message.type === 'audio' && message.mediaUrl && (
          <View style={s.audioBox}>
            <Text style={s.audioIcon}>🎵</Text>
            <View style={s.audioBar} />
          </View>
        )}
        {message.type === 'file' && message.mediaUrl && (
          <View style={s.fileBox}>
            <Text style={s.fileIcon}>📄</Text>
            <Text style={s.fileName}>{message.content || 'File'}</Text>
          </View>
        )}
        {(message.type === 'text' || !message.type) && (
          <Text style={s.text}>{isSent ? message.content : (message.translatedContent || message.content)}</Text>
        )}
        {!isSent && message.translatedContent && message.translatedContent !== message.content && (
          <Text style={s.originalText}>Original: {message.content}</Text>
        )}
        <View style={s.meta}>
          <Text style={s.time}>{formatTime(message.createdAt)}</Text>
          {isSent && <Text style={[s.statusTick, { color: statusColor }]}>{statusIcon}</Text>}
        </View>
      </TouchableOpacity>

      {showMenu && (
        <View style={[s.menu, isSent ? s.menuSent : s.menuReceived]}>
          <TouchableOpacity style={s.menuItem} onPress={() => { onReply(message); setShowMenu(false); }}>
            <Text style={s.menuText}>↩ Reply</Text>
          </TouchableOpacity>
          {isSent && (
            <TouchableOpacity style={s.menuItem} onPress={() => { onDelete(message.id, 'everyone'); setShowMenu(false); }}>
              <Text style={[s.menuText, { color: RED }]}>🗑 Delete for everyone</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.menuItem} onPress={() => { onDelete(message.id, 'me'); setShowMenu(false); }}>
            <Text style={[s.menuText, { color: RED }]}>🗑 Delete for me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem} onPress={() => setShowMenu(false)}>
            <Text style={s.menuText}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { marginBottom: 2, paddingHorizontal: 60 },
  rowSent: { alignItems: 'flex-end' },
  rowReceived: { alignItems: 'flex-start' },
  bubble: { maxWidth: '65%', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, paddingBottom: 20, position: 'relative' },
  bubbleSent: { backgroundColor: SENT_BUBBLE, borderTopRightRadius: 0 },
  bubbleReceived: { backgroundColor: RECEIVED_BUBBLE, borderTopLeftRadius: 0 },
  deletedBubble: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingBottom: 8 },
  deletedText: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  text: { fontSize: 14.2, color: '#111B21', lineHeight: 20 },
  originalText: { fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 4 },
  meta: { position: 'absolute', bottom: 3, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  time: { fontSize: 11, color: '#667781' },
  statusTick: { fontSize: 12 },
  replyBox: { backgroundColor: 'rgba(0,0,0,0.05)', borderLeftWidth: 3, borderLeftColor: TEAL, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4 },
  replyText: { fontSize: 12, color: '#666' },
  mediaBox: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: 20, alignItems: 'center', marginBottom: 4 },
  mediaPlaceholder: { fontSize: 32 },
  audioBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  audioIcon: { fontSize: 20 },
  audioBar: { flex: 1, height: 4, backgroundColor: TEAL, borderRadius: 2 },
  fileBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  fileIcon: { fontSize: 24 },
  fileName: { fontSize: 13, color: DARK, flex: 1 },
  menu: { position: 'absolute', backgroundColor: WHITE, borderRadius: 8, elevation: 4, zIndex: 100, minWidth: 180, borderWidth: 1, borderColor: BORDER },
  menuSent: { right: 60, top: 0 },
  menuReceived: { left: 60, top: 0 },
  menuItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  menuText: { fontSize: 14, color: DARK },
});
