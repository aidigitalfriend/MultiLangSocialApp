import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { DARK, WHITE, TEAL, SIDEBAR_HEADER, BORDER } from './theme';

export default function MessageInput({ onSend, onTyping, replyTo, onCancelReply, onSendMedia }) {
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (val) => {
    setText(val);
    if (onTyping) onTyping(val.length > 0);
  };

  const handleFileSelect = (type) => {
    setShowAttach(false);
    // Create a file input for web
    const input = document.createElement('input');
    input.type = 'file';
    if (type === 'image') input.accept = 'image/*';
    else if (type === 'video') input.accept = 'video/*';
    else if (type === 'audio') input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && onSendMedia) onSendMedia(file, type);
    };
    input.click();
  };

  return (
    <View style={s.container}>
      {replyTo && (
        <View style={s.replyBar}>
          <View style={s.replyInfo}>
            <Text style={s.replyLabel}>Replying to</Text>
            <Text style={s.replyText} numberOfLines={1}>{replyTo.content}</Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={s.replyClose}>
            <Text style={s.replyCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.inputRow}>
        <TouchableOpacity style={s.iconBtn}><Text style={s.iconText}>😊</Text></TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => setShowAttach(!showAttach)}>
          <Text style={s.iconText}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={s.textInput}
          placeholder="Type a message"
          placeholderTextColor="#999"
          value={text}
          onChangeText={handleTextChange}
          multiline
          onKeyPress={handleKeyPress}
        />
        {text.trim() ? (
          <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
            <Text style={s.sendIcon}>➤</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.iconText}>🎤</Text>
          </TouchableOpacity>
        )}
      </View>
      {showAttach && (
        <View style={s.attachMenu}>
          <TouchableOpacity style={s.attachItem} onPress={() => handleFileSelect('image')}>
            <View style={[s.attachIcon, { backgroundColor: '#7C4DFF' }]}><Text style={s.attachEmoji}>🖼️</Text></View>
            <Text style={s.attachLabel}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.attachItem} onPress={() => handleFileSelect('video')}>
            <View style={[s.attachIcon, { backgroundColor: '#FF5252' }]}><Text style={s.attachEmoji}>🎥</Text></View>
            <Text style={s.attachLabel}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.attachItem} onPress={() => handleFileSelect('audio')}>
            <View style={[s.attachIcon, { backgroundColor: '#FF6D00' }]}><Text style={s.attachEmoji}>🎵</Text></View>
            <Text style={s.attachLabel}>Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.attachItem} onPress={() => handleFileSelect('file')}>
            <View style={[s.attachIcon, { backgroundColor: '#00BFA5' }]}><Text style={s.attachEmoji}>📄</Text></View>
            <Text style={s.attachLabel}>File</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: SIDEBAR_HEADER, borderTopWidth: 0.5, borderTopColor: BORDER },
  replyBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  replyInfo: { flex: 1, borderLeftWidth: 3, borderLeftColor: TEAL, paddingLeft: 10 },
  replyLabel: { fontSize: 12, color: TEAL, fontWeight: '600' },
  replyText: { fontSize: 13, color: '#666' },
  replyClose: { padding: 8 },
  replyCloseText: { fontSize: 18, color: '#999' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { padding: 8 },
  iconText: { fontSize: 22, color: '#54656F' },
  textInput: { flex: 1, backgroundColor: WHITE, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120, marginHorizontal: 6, outlineStyle: 'none', color: DARK },
  sendBtn: { backgroundColor: TEAL, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  sendIcon: { color: WHITE, fontSize: 18 },
  attachMenu: { flexDirection: 'row', padding: 16, gap: 20, justifyContent: 'center', borderTopWidth: 0.5, borderTopColor: BORDER },
  attachItem: { alignItems: 'center', gap: 6 },
  attachIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  attachEmoji: { fontSize: 24 },
  attachLabel: { fontSize: 12, color: '#666' },
});
