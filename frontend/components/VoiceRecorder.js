import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiUpload } from './api';
import { TEAL, DARK, WHITE, BORDER, RED } from './theme';

export default function VoiceRecorder({ token, onVoiceReady, onCancel, maxDuration = 300 }) {
  const [state, setState] = useState('idle'); // idle | recording | recorded | uploading
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = async () => {
    if (!navigator.mediaDevices) { setError('Microphone not supported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        setState('recorded');
      };
      recorderRef.current = recorder;
      recorder.start();
      setState('recording');
      setDuration(0);
      setError('');
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) { stopRecording(); return maxDuration; }
          return prev + 1;
        });
      }, 1000);
    } catch { setError('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const cancelRecording = () => {
    stopRecording();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
    if (onCancel) onCancel();
  };

  const sendVoice = async () => {
    if (!audioBlob) return;
    setState('uploading');
    try {
      const fd = new FormData();
      fd.append('media', audioBlob, `voice_${Date.now()}.webm`);
      fd.append('type', 'audio');
      const data = await apiUpload('/media', token, fd);
      if (data.url) {
        onVoiceReady({ url: data.url, duration, type: 'audio' });
        setState('idle'); setAudioBlob(null); setAudioUrl(null); setDuration(0);
      } else { setError(data.error || 'Upload failed'); setState('recorded'); }
    } catch { setError('Upload failed'); setState('recorded'); }
  };

  return (
    <View style={s.container}>
      {state === 'idle' && (
        <View style={s.center}>
          <TouchableOpacity style={s.micBtn} onPress={startRecording}>
            <Text style={s.micIcon}>🎙️</Text>
          </TouchableOpacity>
          <Text style={s.hint}>Tap to record voice message</Text>
          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>
      )}

      {state === 'recording' && (
        <View style={s.center}>
          <View style={s.recRow}>
            <View style={s.recDot} />
            <Text style={s.recTimer}>{fmt(duration)}</Text>
          </View>
          <View style={s.waveform}>
            {Array.from({ length: 20 }, (_, i) => (
              <View key={i} style={[s.waveBar, { height: 6 + Math.random() * 20, opacity: 0.3 + Math.random() * 0.7 }]} />
            ))}
          </View>
          <View style={s.recActions}>
            <TouchableOpacity style={s.cancelMicBtn} onPress={cancelRecording}>
              <Text style={s.cancelMicText}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.stopMicBtn} onPress={stopRecording}>
              <Text style={s.stopMicText}>⏹</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === 'recorded' && (
        <View style={s.center}>
          <View style={s.playRow}>
            <Text style={{ fontSize: 28 }}>🎵</Text>
            <Text style={s.playDuration}>{fmt(duration)}</Text>
          </View>
          {audioUrl && (
            <audio controls src={audioUrl} style={{ marginTop: 8, marginBottom: 8, width: '100%', maxWidth: 280, height: 36 }} />
          )}
          {error ? <Text style={s.error}>{error}</Text> : null}
          <View style={s.doneActions}>
            <TouchableOpacity style={s.reRecBtn} onPress={() => { setAudioBlob(null); setAudioUrl(null); setState('idle'); setDuration(0); }}>
              <Text style={s.reRecText}>Re-record</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sendBtn} onPress={sendVoice}>
              <Text style={s.sendText}>➤ Send</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={cancelRecording} style={{ marginTop: 12 }}>
            <Text style={s.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'uploading' && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={s.uploadText}>Sending voice message...</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 16 },
  center: { alignItems: 'center' },
  micBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', shadowColor: TEAL, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 },
  micIcon: { fontSize: 30 },
  hint: { fontSize: 13, color: '#888', marginTop: 10 },
  error: { fontSize: 13, color: RED, marginTop: 8 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: RED },
  recTimer: { fontSize: 28, fontWeight: '300', color: DARK },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 16, height: 30 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: TEAL },
  recActions: { flexDirection: 'row', gap: 24 },
  cancelMicBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' },
  cancelMicText: { fontSize: 22 },
  stopMicBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  stopMicText: { fontSize: 22, color: WHITE },
  playRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playDuration: { fontSize: 18, fontWeight: '500', color: DARK },
  doneActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  reRecBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  reRecText: { color: '#666', fontWeight: '500', fontSize: 14 },
  sendBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: TEAL },
  sendText: { color: WHITE, fontWeight: '600', fontSize: 14 },
  cancelLink: { color: '#999', fontSize: 13 },
  uploadText: { fontSize: 14, color: '#888', marginTop: 12 },
});
