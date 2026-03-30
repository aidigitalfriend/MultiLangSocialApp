import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TEAL, DARK, WHITE, RED, GREEN, BORDER } from './theme';
import { Avatar } from './Common';

export default function VideoCall({ user, isCaller, onEnd, onAnswer, onReject, socket, userId }) {
  const [status, setStatus] = useState(isCaller ? 'calling' : 'ringing');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    startLocalVideo();
    if (isCaller && socket) {
      socket.emit('callUser', { callerId: userId, receiverId: user.id, callType: 'video' });
    }
    if (socket) {
      socket.on('callAnswered', () => {
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

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: frontCamera ? 'user' : 'environment' },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access failed:', err);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
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

  const toggleMute = () => {
    setMuted(prev => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = prev; });
      }
      return !prev;
    });
  };

  const toggleCamera = () => {
    setCameraOff(prev => {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = prev; });
      }
      return !prev;
    });
  };

  const flipCamera = async () => {
    setFrontCamera(prev => !prev);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: !frontCamera ? 'user' : 'environment' },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      if (muted) stream.getAudioTracks().forEach(t => { t.enabled = false; });
    } catch {}
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={s.overlay}>
      {/* Remote video (full screen background) */}
      <View style={s.remoteVideo}>
        {status === 'connected' ? (
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#111' }} />
        ) : (
          <View style={s.avatarWrap}>
            <Avatar name={user.username} size={120} />
            <Text style={s.callerName}>{user.username}</Text>
            <Text style={s.statusText}>
              {status === 'calling' ? '📹 Calling...' :
               status === 'ringing' ? '📹 Incoming video call' :
               'Call ended'}
            </Text>
          </View>
        )}
      </View>

      {/* Local video (small PiP) */}
      <View style={s.localVideo}>
        {!cameraOff ? (
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, transform: 'scaleX(-1)' }} />
        ) : (
          <View style={s.cameraOffBox}>
            <Text style={{ fontSize: 24 }}>📷</Text>
            <Text style={s.cameraOffText}>Camera off</Text>
          </View>
        )}
      </View>

      {/* Duration overlay */}
      {status === 'connected' && (
        <View style={s.durationBar}>
          <View style={s.durationDot} />
          <Text style={s.durationText}>{fmt(duration)}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={s.controls}>
        {status === 'connected' && (
          <View style={s.midControls}>
            <TouchableOpacity style={[s.ctrlBtn, muted && s.ctrlActive]} onPress={toggleMute}>
              <Text style={s.ctrlIcon}>{muted ? '🔇' : '🎙️'}</Text>
              <Text style={s.ctrlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.ctrlBtn, cameraOff && s.ctrlActive]} onPress={toggleCamera}>
              <Text style={s.ctrlIcon}>{cameraOff ? '📷' : '📹'}</Text>
              <Text style={s.ctrlLabel}>{cameraOff ? 'Camera On' : 'Camera Off'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctrlBtn} onPress={flipCamera}>
              <Text style={s.ctrlIcon}>🔄</Text>
              <Text style={s.ctrlLabel}>Flip</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.bottomBtns}>
          {status === 'ringing' && (
            <>
              <TouchableOpacity style={s.rejectBtn} onPress={handleReject}>
                <Text style={s.btnIcon}>📵</Text>
                <Text style={s.btnLabel}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.answerBtn} onPress={handleAnswer}>
                <Text style={s.btnIcon}>📹</Text>
                <Text style={s.btnLabel}>Answer</Text>
              </TouchableOpacity>
            </>
          )}
          {(status === 'calling' || status === 'connected') && (
            <TouchableOpacity style={s.endBtn} onPress={handleEnd}>
              <Text style={s.btnIcon}>📵</Text>
              <Text style={s.btnLabel}>End</Text>
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
  );
}

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1000 },
  remoteVideo: { flex: 1, backgroundColor: '#111' },
  avatarWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  callerName: { fontSize: 28, fontWeight: '700', color: WHITE, marginTop: 20 },
  statusText: { fontSize: 16, color: '#AAA', marginTop: 8 },
  localVideo: { position: 'absolute', top: 20, right: 20, width: 120, height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#222', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', zIndex: 10 },
  cameraOffBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#333' },
  cameraOffText: { color: '#888', fontSize: 11, marginTop: 4 },
  durationBar: { position: 'absolute', top: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 5 },
  durationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: RED },
  durationText: { color: WHITE, fontSize: 16, fontWeight: '600' },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, alignItems: 'center', zIndex: 20 },
  midControls: { flexDirection: 'row', gap: 24, marginBottom: 30 },
  ctrlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  ctrlActive: { backgroundColor: WHITE },
  ctrlIcon: { fontSize: 22 },
  ctrlLabel: { fontSize: 9, color: WHITE, marginTop: 2 },
  bottomBtns: { flexDirection: 'row', gap: 50, justifyContent: 'center' },
  rejectBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  answerBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  endBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  btnIcon: { fontSize: 26 },
  btnLabel: { fontSize: 10, color: WHITE, marginTop: 1 },
  closeBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  closeText: { color: WHITE, fontSize: 16, fontWeight: '600' },
});
