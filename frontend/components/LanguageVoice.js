import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { api, apiUpload } from './api';
import { TEAL, DARK, WHITE, SIDEBAR_BG, SIDEBAR_HEADER, BORDER, RED, LANGUAGES } from './theme';

export default function LanguageVoice({ language, hasVoiceSample, token, onBack, onLanguageChange }) {
  const [selectedLang, setSelectedLang] = useState(language || '');
  const [langSearch, setLangSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [hasVoice, setHasVoice] = useState(hasVoiceSample);
  const [voiceMsg, setVoiceMsg] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const saveLang = async (lang) => {
    setSelectedLang(lang);
    try {
      await api('/profile', token, { method: 'PUT', body: JSON.stringify({ language: lang }) });
      onLanguageChange(lang);
    } catch {}
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices) { setVoiceMsg('Microphone not supported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setVoiceMsg('');
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) { stopRecording(); return 120; }
          return prev + 1;
        });
      }, 1000);
    } catch { setVoiceMsg('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const uploadVoice = async () => {
    if (!audioBlob) return;
    if (recordingTime < 60) { setVoiceMsg('Recording must be at least 1 minute'); return; }
    setVoiceMsg('Uploading...');
    try {
      const fd = new FormData();
      fd.append('voice', audioBlob, 'voice.webm');
      const data = await apiUpload('/voice-sample', token, fd);
      if (data.success) { setHasVoice(true); setVoiceMsg('Voice sample saved!'); setAudioBlob(null); }
      else setVoiceMsg(data.error || 'Upload failed');
    } catch { setVoiceMsg('Upload failed. Try again.'); }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const filteredLangs = langSearch.trim() ? LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase())) : LANGUAGES;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Language & Voice</Text>
      </View>
      <ScrollView style={s.content}>
        <View style={s.section}><Text style={s.sectionTitle}>YOUR LANGUAGE</Text></View>
        {selectedLang ? (
          <View style={s.langBox}>
            <Text style={s.langFlag}>🌐</Text>
            <Text style={s.langText}>{selectedLang}</Text>
            <TouchableOpacity onPress={() => saveLang('')}><Text style={s.changeBtn}>Change</Text></TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={s.searchWrap}>
              <TextInput style={s.searchInput} placeholder="Search language..." placeholderTextColor="#999" value={langSearch} onChangeText={setLangSearch} />
            </View>
            {filteredLangs.map(lang => (
              <TouchableOpacity key={lang} style={s.langItem} onPress={() => { saveLang(lang); setLangSearch(''); }}>
                <Text style={s.langItemText}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[s.section, { marginTop: 24 }]}><Text style={s.sectionTitle}>VOICE SAMPLE FOR CLONING</Text></View>
        <Text style={s.voiceDesc}>Record 1-2 minutes of your voice for cloning translated messages. Speak naturally in {selectedLang || 'your language'}.</Text>

        {hasVoice && !audioBlob && !isRecording && (
          <View style={s.voiceStatus}><Text>✅</Text><Text style={s.voiceStatusText}>Voice sample recorded</Text></View>
        )}

        <View style={s.recorder}>
          {isRecording ? (
            <View style={s.recActive}>
              <View style={s.recDot} />
              <Text style={s.recTimer}>{fmt(recordingTime)}</Text>
              <Text style={s.recHint}>{recordingTime < 60 ? 'Min 1:00 · keep going' : 'Ready to save'}</Text>
              <TouchableOpacity style={s.stopBtn} onPress={stopRecording}><Text style={s.stopBtnText}>⏹ Stop</Text></TouchableOpacity>
            </View>
          ) : audioBlob ? (
            <View style={s.recDone}>
              <Text style={{ fontSize: 28 }}>🎵</Text>
              <Text style={s.recDoneText}>Recording: {fmt(recordingTime)}</Text>
              {recordingTime < 60 && <Text style={s.recWarn}>Too short - minimum 1 minute</Text>}
              <View style={s.recActions}>
                <TouchableOpacity style={s.reRecBtn} onPress={() => { setAudioBlob(null); setRecordingTime(0); }}><Text style={s.reRecText}>Re-record</Text></TouchableOpacity>
                <TouchableOpacity style={[s.uploadBtn, recordingTime < 60 && { opacity: 0.4 }]} onPress={uploadVoice} disabled={recordingTime < 60}><Text style={s.uploadText}>Save Voice</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.startBtn} onPress={startRecording}>
              <Text style={{ fontSize: 40 }}>🎙️</Text>
              <Text style={s.startText}>{hasVoice ? 'Re-record Voice' : 'Start Recording'}</Text>
              <Text style={s.startHint}>1 min - 2 min</Text>
            </TouchableOpacity>
          )}
        </View>
        {voiceMsg ? <Text style={[s.msg, voiceMsg.includes('saved') && { color: TEAL }]}>{voiceMsg}</Text> : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SIDEBAR_BG },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: SIDEBAR_HEADER, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: DARK, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '600', color: DARK, marginLeft: 12 },
  content: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: TEAL, letterSpacing: 0.5 },
  langBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#E8F5E9', marginHorizontal: 12, borderRadius: 10 },
  langFlag: { fontSize: 20, marginRight: 10 },
  langText: { fontSize: 16, fontWeight: '600', color: DARK, flex: 1 },
  changeBtn: { color: TEAL, fontSize: 14, fontWeight: '600' },
  searchWrap: { paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { backgroundColor: '#F0F2F5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: DARK, outlineStyle: 'none' },
  langItem: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  langItemText: { fontSize: 15, color: DARK },
  voiceDesc: { paddingHorizontal: 20, fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 16 },
  voiceStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#E8F5E9', marginHorizontal: 12, borderRadius: 10, marginBottom: 12, gap: 8 },
  voiceStatusText: { fontSize: 14, color: TEAL, fontWeight: '500' },
  recorder: { marginHorizontal: 12, borderRadius: 12, backgroundColor: '#F9F9F9', overflow: 'hidden' },
  startBtn: { alignItems: 'center', paddingVertical: 24 },
  startText: { fontSize: 16, fontWeight: '600', color: DARK, marginTop: 8 },
  startHint: { fontSize: 12, color: '#999', marginTop: 4 },
  recActive: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFF3F3' },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: RED, marginBottom: 10 },
  recTimer: { fontSize: 32, fontWeight: '300', color: DARK, marginBottom: 4 },
  recHint: { fontSize: 13, color: '#888', marginBottom: 16 },
  stopBtn: { backgroundColor: RED, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 10 },
  stopBtnText: { color: WHITE, fontSize: 14, fontWeight: '600' },
  recDone: { alignItems: 'center', paddingVertical: 20 },
  recDoneText: { fontSize: 15, color: DARK, fontWeight: '500', marginTop: 6 },
  recWarn: { fontSize: 12, color: RED, marginTop: 4 },
  recActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  reRecBtn: { borderWidth: 1, borderColor: BORDER, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10 },
  reRecText: { fontSize: 14, color: '#666' },
  uploadBtn: { backgroundColor: TEAL, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10 },
  uploadText: { color: WHITE, fontSize: 14, fontWeight: '600' },
  msg: { textAlign: 'center', fontSize: 13, color: RED, marginTop: 12, marginBottom: 20 },
});
