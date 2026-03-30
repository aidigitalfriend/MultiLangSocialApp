import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TEAL, DARK, WHITE, RED, GREEN, BORDER } from './theme';
import { Avatar } from './Common';

export default function VoiceCall({ user, isCaller, onEnd, onAnswer, onReject, socket, userId }) {
  const [status, setStatus] = useState(isCaller ? 'calling' : 'ringing'); // calling | ringing | connected | ended
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    if (isCaller && socket) {
      socket.emit('callUser', { callerId: userId, receiverId: user.id, callType: 'voice' });
    }
    // Listen for call events
    if (socket) {
      socket.on('callAnswered', ({ callId }) => {
        setStatus('connected');
        startTimer();
      });
      socket.on('callRejected', () => {
        setStatus('ended');
        cleanup();
      });
      socket.on('callEnded', () => {
        setStatus('ended');
        cleanup();
      });
    }
    return () => {
      cleanup();
      if (socket) {
        socket.off('callAnswered');
        socket.off('callRejected');
        socket.off('callEnded');
      }
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const handleAnswer = () => {
    setStatus('connected');
    startTimer();
    if (socket) socket.emit('answerCall', { callerId: user.id, receiverId: userId });
    if (onAnswer) onAnswer();
  };

  const handleReject = () => {
    setStatus('ended');
    if (socket) socket.emit('rejectCall', { callerId: user.id, receiverId: userId });
    cleanup();
    if (onReject) onReject();
  };

  const handleEnd = () => {
    setStatus('ended');
    if (socket) socket.emit('endCall', { userId, otherUserId: user.id, duration });
    cleanup();
    if (onEnd) onEnd(duration);
  };

  const toggleMute = () => setMuted(!muted);
  const toggleSpeaker = () => setSpeaker(!speaker);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={s.overlay}>
      <View style={s.container}>
        {/* Top info */}
        <View style={s.topSection}>
          <Avatar name={user.username} size={100} />
          <Text style={s.callerName}>{user.username}</Text>
          <Text style={s.statusText}>
            {status === 'calling' ? 'Calling...' :
             status === 'ringing' ? 'Incoming voice call' :
             status === 'connected' ? fmt(duration) :
             'Call ended'}
          </Text>
          {status === 'calling' && <Text style={s.subText}>📞 Voice Call</Text>}
        </View>

        {/* Controls */}
        <View style={s.controls}>
          {status === 'connected' && (
            <View style={s.midControls}>
              <TouchableOpacity style={[s.controlBtn, muted && s.controlActive]} onPress={toggleMute}>
                <Text style={s.controlIcon}>{muted ? '🔇' : '🎙️'}</Text>
                <Text style={s.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.controlBtn, speaker && s.controlActive]} onPress={toggleSpeaker}>
                <Text style={s.controlIcon}>{speaker ? '🔊' : '🔈'}</Text>
                <Text style={s.controlLabel}>Speaker</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom buttons */}
          <View style={s.bottomBtns}>
            {status === 'ringing' && (
              <>
                <TouchableOpacity style={s.rejectBtn} onPress={handleReject}>
                  <Text style={s.btnIcon}>📵</Text>
                  <Text style={s.rejectText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.answerBtn} onPress={handleAnswer}>
                  <Text style={s.btnIcon}>📞</Text>
                  <Text style={s.answerText}>Answer</Text>
                </TouchableOpacity>
              </>
            )}
            {(status === 'calling' || status === 'connected') && (
              <TouchableOpacity style={s.endBtn} onPress={handleEnd}>
                <Text style={s.btnIcon}>📵</Text>
                <Text style={s.endText}>End Call</Text>
              </TouchableOpacity>
            )}
            {status === 'ended' && (
              <TouchableOpacity style={s.closeBtn} onPress={() => onEnd(duration)}>
                <Text style={s.closeText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, width: '100%', maxWidth: 400, justifyContent: 'space-between', paddingVertical: 60 },
  topSection: { alignItems: 'center' },
  callerName: { fontSize: 28, fontWeight: '700', color: WHITE, marginTop: 20 },
  statusText: { fontSize: 16, color: '#AAA', marginTop: 8 },
  subText: { fontSize: 14, color: '#666', marginTop: 6 },
  controls: { alignItems: 'center' },
  midControls: { flexDirection: 'row', gap: 40, marginBottom: 40 },
  controlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  controlActive: { backgroundColor: WHITE },
  controlIcon: { fontSize: 24 },
  controlLabel: { fontSize: 10, color: WHITE, marginTop: 4 },
  bottomBtns: { flexDirection: 'row', gap: 40, justifyContent: 'center' },
  rejectBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  rejectText: { fontSize: 10, color: WHITE, marginTop: 2 },
  answerBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  answerText: { fontSize: 10, color: WHITE, marginTop: 2 },
  endBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  endText: { fontSize: 10, color: WHITE, marginTop: 2 },
  btnIcon: { fontSize: 28 },
  closeBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  closeText: { color: WHITE, fontSize: 16, fontWeight: '600' },
});
