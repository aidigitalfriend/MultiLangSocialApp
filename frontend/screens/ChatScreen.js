import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import io from 'socket.io-client';

import { TEAL, TEAL_DARK, WHITE, DARK, BG, CHAT_BG, SIDEBAR_BG, SIDEBAR_HEADER, BORDER } from '../components/theme';
import { api, API_URL } from '../components/api';

// Sidebar components
import SidebarHeader from '../components/SidebarHeader';
import ChatList from '../components/ChatList';
import ContactList from '../components/ContactList';
import CallsTab from '../components/CallsTab';
import GroupList from '../components/GroupList';
import FriendRequests from '../components/FriendRequests';

// Settings components
import SettingsMenu from '../components/SettingsMenu';
import AccountSettings from '../components/AccountSettings';
import LanguageVoice from '../components/LanguageVoice';

// Chat panel components
import ChatPanel from '../components/ChatPanel';
import GroupChatPanel from '../components/GroupChatPanel';
import EmptyPanel from '../components/EmptyPanel';
import ContactInfo from '../components/ContactInfo';

// Overlay / tool components
import VoiceCall from '../components/VoiceCall';
import VideoCall from '../components/VideoCall';
import FileUploader from '../components/FileUploader';
import VoiceRecorder from '../components/VoiceRecorder';
import CameraCapture from '../components/CameraCapture';
import SpeechToText from '../components/SpeechToText';
import Notifications from '../components/Notifications';

export default function ChatScreen({ route, navigation }) {
  const { userId, token } = route.params;

  // ── Core state ──
  const [socketRef, setSocketRef] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [profile, setProfile] = useState({ username: '', email: '', language: '', about: '' });

  // ── UI navigation ──
  const [activeTab, setActiveTab] = useState('chats');        // chats | contacts | calls
  const [sidebarView, setSidebarView] = useState('main');     // main | settings | account | language | friendRequests | notifications
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Realtime ──
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});         // { odx odx odx odxuserId: username }
  const [replyTo, setReplyTo] = useState(null);

  // ── Overlays ──
  const [voiceCallUser, setVoiceCallUser] = useState(null);
  const [videoCallUser, setVideoCallUser] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSpeechToText, setShowSpeechToText] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const [callHistory, setCallHistory] = useState([]);

  // ────────────────────────────────────────────
  // SOCKET SETUP & DATA FETCHING
  // ────────────────────────────────────────────
  useEffect(() => {
    const sock = io(API_URL);
    setSocketRef(sock);

    sock.on('connect', () => sock.emit('join', userId));

    // DM messages
    sock.on('receiveMessage', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Group messages
    sock.on('receiveGroupMessage', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Online / offline
    sock.on('userOnline', ({ userId: uid }) => setOnlineUsers(prev => new Set([...prev, uid])));
    sock.on('userOffline', ({ userId: uid }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(uid); return s; }));

    // Typing
    sock.on('typing', ({ userId: uid, username, groupId }) => {
      setTypingUsers(prev => ({ ...prev, [uid]: username || 'Someone' }));
    });
    sock.on('stopTyping', ({ userId: uid }) => {
      setTypingUsers(prev => { const n = { ...prev }; delete n[uid]; return n; });
    });

    // Message status
    sock.on('messageStatus', ({ messageId, status }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status } : m));
    });
    sock.on('messagesRead', ({ readBy }) => {
      setMessages(prev => prev.map(m => m.receiverId === readBy && m.senderId === userId ? { ...m, status: 'read' } : m));
    });
    sock.on('messageDeleted', ({ messageId, forEveryone }) => {
      if (forEveryone) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedForEveryone: true, content: '', translatedContent: '', mediaUrl: null } : m));
      }
    });

    // Call signaling
    sock.on('incomingCall', (data) => setIncomingCall(data));
    sock.on('callAnswered', () => {});
    sock.on('callRejected', () => { setVoiceCallUser(null); setVideoCallUser(null); });
    sock.on('callEnded', () => { setVoiceCallUser(null); setVideoCallUser(null); });

    // Notifications (handled in Notifications component via token fetch)
    sock.on('notification', () => {});

    // ── Fetch initial data ──
    api('/messages', token).then(data => { if (Array.isArray(data)) setMessages(data); }).catch(() => {});
    api('/users', token).then(data => { if (Array.isArray(data)) setUsers(data.filter(u => u.id !== userId)); }).catch(() => {});
    api('/contacts', token).then(data => { if (Array.isArray(data)) setContacts(data); }).catch(() => {});
    api('/groups', token).then(data => { if (Array.isArray(data)) setGroups(data); }).catch(() => {});
    api('/calls', token).then(data => { if (Array.isArray(data)) setCallHistory(data); }).catch(() => {});
    api('/profile', token).then(data => {
      if (data && data.username) setProfile(data);
    }).catch(() => {});

    return () => sock.disconnect();
  }, [token, userId]);

  // ── Mark online users from fetched user list ──
  useEffect(() => {
    const online = new Set();
    users.forEach(u => { if (u.isOnline) online.add(u.id); });
    contacts.forEach(c => { if (c.isOnline) online.add(c.id); });
    setOnlineUsers(prev => new Set([...prev, ...online]));
  }, [users, contacts]);

  // ────────────────────────────────────────────
  // ACTIONS
  // ────────────────────────────────────────────

  const handleSendDM = useCallback((data) => {
    if (!socketRef) return;
    socketRef.emit('sendMessage', {
      senderId: userId,
      receiverId: selectedUser?.id,
      content: data.content || '',
      type: data.type || 'text',
      mediaUrl: data.mediaUrl || null,
      replyToId: replyTo?.id || null,
    });
    setReplyTo(null);
  }, [socketRef, userId, selectedUser, replyTo]);

  const handleSendGroupMsg = useCallback((data) => {
    if (!socketRef || !selectedGroup) return;
    socketRef.emit('sendGroupMessage', {
      senderId: userId,
      groupId: selectedGroup.id,
      content: data.content || '',
      type: data.type || 'text',
      mediaUrl: data.mediaUrl || null,
      replyToId: replyTo?.id || null,
    });
    setReplyTo(null);
  }, [socketRef, userId, selectedGroup, replyTo]);

  const handleDeleteMessage = useCallback(async (messageId, forEveryone) => {
    try {
      await api(`/messages/${messageId}`, token, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forEveryone }),
      });
      if (!forEveryone) setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch {}
  }, [token]);

  const handleTyping = useCallback((isTyping) => {
    if (!socketRef) return;
    const data = { userId, username: profile.username };
    if (selectedGroup) data.groupId = selectedGroup.id;
    else if (selectedUser) data.receiverId = selectedUser.id;
    socketRef.emit(isTyping ? 'typing' : 'stopTyping', data);
  }, [socketRef, userId, profile.username, selectedUser, selectedGroup]);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setShowContactInfo(null);
    setSidebarView('main');
    // Mark messages as read
    api(`/messages/read/${user.id}`, token, { method: 'PUT' }).catch(() => {});
  }, [token]);

  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setShowContactInfo(null);
    setSidebarView('main');
  }, []);

  const handleVoiceCall = useCallback((user) => {
    setIsCaller(true);
    setVoiceCallUser(user);
    if (socketRef) socketRef.emit('callUser', { callerId: userId, receiverId: user.id, callType: 'voice', callerName: profile.username });
  }, [socketRef, userId, profile.username]);

  const handleVideoCall = useCallback((user) => {
    setIsCaller(true);
    setVideoCallUser(user);
    if (socketRef) socketRef.emit('callUser', { callerId: userId, receiverId: user.id, callType: 'video', callerName: profile.username });
  }, [socketRef, userId, profile.username]);

  const handleAnswerCall = useCallback(() => {
    if (!incomingCall) return;
    const callerUser = users.find(u => u.id === incomingCall.callerId) || { id: incomingCall.callerId, username: incomingCall.callerName };
    setIsCaller(false);
    if (incomingCall.callType === 'video') setVideoCallUser(callerUser);
    else setVoiceCallUser(callerUser);
    if (socketRef) socketRef.emit('answerCall', { callId: incomingCall.callId, callerId: incomingCall.callerId });
    setIncomingCall(null);
  }, [incomingCall, socketRef, users]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCall || !socketRef) return;
    socketRef.emit('rejectCall', { callId: incomingCall.callId, callerId: incomingCall.callerId });
    setIncomingCall(null);
  }, [incomingCall, socketRef]);

  const handleEndCall = useCallback(() => {
    setVoiceCallUser(null);
    setVideoCallUser(null);
  }, []);

  const handleSendMedia = useCallback((mediaUrl, type) => {
    if (selectedGroup) handleSendGroupMsg({ content: '', type, mediaUrl });
    else handleSendDM({ content: '', type, mediaUrl });
  }, [selectedGroup, handleSendGroupMsg, handleSendDM]);

  const handleLogout = useCallback(() => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('v4u_userId');
      localStorage.removeItem('v4u_token');
      window.location.href = 'https://v4u.ai';
    }
  }, []);

  const refreshContacts = useCallback(() => {
    api('/contacts', token).then(data => { if (Array.isArray(data)) setContacts(data); }).catch(() => {});
  }, [token]);

  const refreshGroups = useCallback(() => {
    api('/groups', token).then(data => { if (Array.isArray(data)) setGroups(data); }).catch(() => {});
  }, [token]);

  // ────────────────────────────────────────────
  // DERIVED DATA
  // ────────────────────────────────────────────

  // Unread count for sidebar badge
  const unreadCount = messages.filter(m => m.receiverId === userId && m.status !== 'read' && m.senderId !== userId).length;

  // Filter messages for current chat
  const chatMessages = selectedUser
    ? messages.filter(m => !m.groupId && ((m.senderId === userId && m.receiverId === selectedUser.id) || (m.senderId === selectedUser.id && m.receiverId === userId)))
    : [];

  const groupMessages = selectedGroup
    ? messages.filter(m => m.groupId === selectedGroup.id)
    : [];

  // Get members for selected group
  const groupMembers = selectedGroup && selectedGroup.GroupMembers
    ? selectedGroup.GroupMembers.map(gm => gm.User).filter(Boolean)
    : [];

  // IsTyping for current DM
  const isTypingDM = selectedUser && typingUsers[selectedUser.id] ? true : false;

  // ────────────────────────────────────────────
  // SIDEBAR RENDER
  // ────────────────────────────────────────────
  const renderSidebar = () => {
    // Sub-views
    if (sidebarView === 'settings') return (
      <SettingsMenu
        profile={profile}
        language={profile.language}
        hasVoiceSample={!!profile.voiceSample}
        onBack={() => setSidebarView('main')}
        onAccount={() => setSidebarView('account')}
        onLanguage={() => setSidebarView('language')}
        onLogout={handleLogout}
      />
    );
    if (sidebarView === 'account') return (
      <AccountSettings
        profile={profile}
        token={token}
        onBack={() => setSidebarView('settings')}
        onProfileUpdate={(updated) => setProfile(p => ({ ...p, ...updated }))}
      />
    );
    if (sidebarView === 'language') return (
      <LanguageVoice
        language={profile.language}
        hasVoiceSample={!!profile.voiceSample}
        token={token}
        onBack={() => setSidebarView('settings')}
        onLanguageChange={(lang) => setProfile(p => ({ ...p, language: lang }))}
      />
    );
    if (sidebarView === 'friendRequests') return (
      <FriendRequests
        token={token}
        userId={userId}
        onBack={() => setSidebarView('main')}
        onSelectChat={(user) => { handleSelectUser(user); refreshContacts(); }}
        onlineUsers={onlineUsers}
      />
    );
    if (sidebarView === 'notifications') return (
      <Notifications
        token={token}
        userId={userId}
        onBack={() => setSidebarView('main')}
        onSelectChat={handleSelectUser}
        onFriendRequests={() => setSidebarView('friendRequests')}
        onlineUsers={onlineUsers}
      />
    );

    // Main sidebar with tabs
    return (
      <View style={s.sidebar}>
        <SidebarHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSettingsPress={() => setSidebarView('settings')}
          onNewChat={() => setActiveTab('contacts')}
          unreadCount={unreadCount}
        />
        {activeTab === 'chats' && (
          <ChatList
            users={[...contacts, ...users.filter(u => !contacts.some(c => c.id === u.id))]}
            messages={messages}
            userId={userId}
            selectedUser={selectedUser}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectUser={handleSelectUser}
            onlineUsers={onlineUsers}
          />
        )}
        {activeTab === 'contacts' && (
          <View style={s.sidebarBody}>
            <ContactList
              token={token}
              userId={userId}
              onSelectChat={(u) => { handleSelectUser(u); refreshContacts(); }}
              onlineUsers={onlineUsers}
            />
            <View style={s.sidebarLinks}>
              <View style={s.linkRow}>
                <TouchableOpacity style={s.linkBtn} onPress={() => setSidebarView('friendRequests')}>
                  <View style={s.linkBtnInner}><View><Text style={s.linkText}>📨 Friend Requests</Text></View></View>
                </TouchableOpacity>
              </View>
            </View>
            <GroupList
              token={token}
              userId={userId}
              contacts={contacts}
              onSelectGroup={(g) => { handleSelectGroup(g); refreshGroups(); }}
              onlineUsers={onlineUsers}
            />
          </View>
        )}
        {activeTab === 'calls' && (
          <CallsTab
            token={token}
            userId={userId}
            onlineUsers={onlineUsers}
            onSelectChat={handleSelectUser}
          />
        )}
      </View>
    );
  };

  // ────────────────────────────────────────────
  // RIGHT PANEL RENDER
  // ────────────────────────────────────────────
  const renderRightPanel = () => {
    if (showContactInfo) return (
      <ContactInfo
        user={showContactInfo}
        onlineUsers={onlineUsers}
        onBack={() => setShowContactInfo(null)}
        onBlock={() => { setShowContactInfo(null); setSelectedUser(null); }}
        onMessage={(u) => { handleSelectUser(u); setShowContactInfo(null); }}
        callHistory={callHistory.filter(c => c.callerId === showContactInfo.id || c.receiverId === showContactInfo.id)}
      />
    );

    if (selectedGroup) return (
      <GroupChatPanel
        group={selectedGroup}
        messages={groupMessages}
        userId={userId}
        members={groupMembers}
        onSend={handleSendGroupMsg}
        onDelete={handleDeleteMessage}
        onReply={setReplyTo}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={handleTyping}
        onInfoPress={() => {}}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        onSendMedia={handleSendMedia}
        onBack={() => setSelectedGroup(null)}
      />
    );

    if (selectedUser) return (
      <ChatPanel
        user={selectedUser}
        messages={chatMessages}
        userId={userId}
        onSend={handleSendDM}
        onDelete={handleDeleteMessage}
        onReply={setReplyTo}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={handleTyping}
        onVoiceCall={() => handleVoiceCall(selectedUser)}
        onVideoCall={() => handleVideoCall(selectedUser)}
        onInfoPress={() => setShowContactInfo(selectedUser)}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        onSendMedia={handleSendMedia}
      />
    );

    return <EmptyPanel />;
  };

  // ────────────────────────────────────────────
  // OVERLAYS
  // ────────────────────────────────────────────
  const renderOverlays = () => (
    <>
      {voiceCallUser && (
        <VoiceCall
          user={voiceCallUser}
          isCaller={isCaller}
          onEnd={handleEndCall}
          onAnswer={handleAnswerCall}
          onReject={() => { handleRejectCall(); setVoiceCallUser(null); }}
          socket={socketRef}
          userId={userId}
        />
      )}
      {videoCallUser && (
        <VideoCall
          user={videoCallUser}
          isCaller={isCaller}
          onEnd={handleEndCall}
          onAnswer={handleAnswerCall}
          onReject={() => { handleRejectCall(); setVideoCallUser(null); }}
          socket={socketRef}
          userId={userId}
        />
      )}
      {incomingCall && !voiceCallUser && !videoCallUser && (
        <View style={s.incomingCallOverlay}>
          <View style={s.incomingCallCard}>
            <View style={s.incomingCallText}>
              <Text style={s.incomingCallTitle}>📞 Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call</Text>
              <Text style={s.incomingCallName}>{incomingCall.callerName || 'Unknown'}</Text>
            </View>
            <View style={s.incomingCallActions}>
              <TouchableOpacity style={s.callRejectBtn} onPress={handleRejectCall}><Text style={s.callBtnText}>✕ Decline</Text></TouchableOpacity>
              <TouchableOpacity style={s.callAnswerBtn} onPress={handleAnswerCall}><Text style={s.callBtnText}>✓ Answer</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {showFileUploader && (
        <View style={s.overlay}>
          <FileUploader
            token={token}
            onFileUploaded={(url, type) => { handleSendMedia(url, type); setShowFileUploader(false); }}
            onCancel={() => setShowFileUploader(false)}
          />
        </View>
      )}
      {showVoiceRecorder && (
        <View style={s.overlay}>
          <VoiceRecorder
            token={token}
            onVoiceReady={(url) => { handleSendMedia(url, 'audio'); setShowVoiceRecorder(false); }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </View>
      )}
      {showCamera && (
        <View style={s.overlay}>
          <CameraCapture
            token={token}
            onCapture={(url, type) => { handleSendMedia(url, type); setShowCamera(false); }}
            onCancel={() => setShowCamera(false)}
          />
        </View>
      )}
      {showSpeechToText && (
        <View style={s.overlay}>
          <SpeechToText
            language={profile.language}
            onTextReady={(text) => {
              if (selectedGroup) handleSendGroupMsg({ content: text, type: 'text' });
              else handleSendDM({ content: text, type: 'text' });
              setShowSpeechToText(false);
            }}
            onCancel={() => setShowSpeechToText(false)}
          />
        </View>
      )}
    </>
  );

  // ────────────────────────────────────────────
  // MAIN RENDER
  // ────────────────────────────────────────────
  return (
    <View style={s.root}>
      {renderSidebar()}
      <View style={s.divider} />
      {renderRightPanel()}
      {renderOverlays()}
    </View>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#D1D7DB', height: '100vh' },
  sidebar: { width: '30%', minWidth: 300, maxWidth: 420, backgroundColor: SIDEBAR_BG, flexDirection: 'column' },
  sidebarBody: { flex: 1, overflow: 'scroll' },
  sidebarLinks: { paddingHorizontal: 12, paddingVertical: 8 },
  linkRow: { flexDirection: 'row' },
  linkBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#F0F2F5', borderRadius: 8, marginBottom: 8, cursor: 'pointer' },
  linkBtnInner: { flexDirection: 'row', alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '500', color: TEAL_DARK },
  divider: { width: 1, backgroundColor: BORDER },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  incomingCallOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, alignItems: 'center', justifyContent: 'center' },
  incomingCallCard: { backgroundColor: WHITE, borderRadius: 16, padding: 30, alignItems: 'center', minWidth: 320 },
  incomingCallText: { alignItems: 'center', marginBottom: 24 },
  incomingCallTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginBottom: 8 },
  incomingCallName: { fontSize: 22, fontWeight: '700', color: TEAL },
  incomingCallActions: { flexDirection: 'row', gap: 16 },
  callRejectBtn: { backgroundColor: '#E53935', borderRadius: 30, paddingHorizontal: 24, paddingVertical: 12, cursor: 'pointer' },
  callAnswerBtn: { backgroundColor: '#4CAF50', borderRadius: 30, paddingHorizontal: 24, paddingVertical: 12, cursor: 'pointer' },
  callBtnText: { color: WHITE, fontSize: 16, fontWeight: '600' },
});
