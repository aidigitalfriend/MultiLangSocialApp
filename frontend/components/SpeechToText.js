import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { TEAL, DARK, WHITE, BORDER, RED } from './theme';

export default function SpeechToText({ language, onTextReady, onCancel }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setError('Speech recognition not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLangCode(language);

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) setTranscript(prev => prev + final);
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied');
      } else {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [language]);

  const getLangCode = (lang) => {
    const map = {
      'English': 'en-US', 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE',
      'Italian': 'it-IT', 'Portuguese': 'pt-BR', 'Chinese': 'zh-CN', 'Japanese': 'ja-JP',
      'Korean': 'ko-KR', 'Arabic': 'ar-SA', 'Hindi': 'hi-IN', 'Bengali': 'bn-BD',
      'Russian': 'ru-RU', 'Turkish': 'tr-TR', 'Vietnamese': 'vi-VN', 'Thai': 'th-TH',
      'Indonesian': 'id-ID', 'Malay': 'ms-MY', 'Dutch': 'nl-NL', 'Polish': 'pl-PL',
      'Swedish': 'sv-SE', 'Greek': 'el-GR', 'Czech': 'cs-CZ', 'Romanian': 'ro-RO',
      'Hungarian': 'hu-HU', 'Finnish': 'fi-FI', 'Danish': 'da-DK', 'Norwegian': 'nb-NO',
      'Hebrew': 'he-IL', 'Urdu': 'ur-PK', 'Filipino': 'fil-PH', 'Ukrainian': 'uk-UA',
      'Swahili': 'sw-KE', 'Persian': 'fa-IR', 'Tamil': 'ta-IN', 'Telugu': 'te-IN',
      'Marathi': 'mr-IN', 'Gujarati': 'gu-IN', 'Kannada': 'kn-IN', 'Malayalam': 'ml-IN',
      'Punjabi': 'pa-IN', 'Nepali': 'ne-NP',
    };
    return map[lang] || 'en-US';
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    setError('');
    setInterimText('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch { setError('Failed to start. Try again.'); }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  const sendText = () => {
    const text = transcript.trim();
    if (text) {
      onTextReady(text);
      setTranscript('');
      setInterimText('');
    }
  };

  const clear = () => {
    setTranscript('');
    setInterimText('');
    setError('');
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🎤 Speech to Text</Text>
        <TouchableOpacity onPress={onCancel}><Text style={s.close}>✕</Text></TouchableOpacity>
      </View>

      <Text style={s.langLabel}>Language: {language || 'English'}</Text>

      {/* Transcript display */}
      <View style={s.transcriptBox}>
        {transcript || interimText ? (
          <Text style={s.transcriptText}>
            {transcript}
            {interimText ? <Text style={s.interim}>{interimText}</Text> : null}
          </Text>
        ) : (
          <Text style={s.placeholder}>
            {isListening ? 'Listening... speak now' : 'Tap the microphone to start speaking'}
          </Text>
        )}
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {/* Mic button */}
      <View style={s.micArea}>
        {isListening ? (
          <View style={s.listeningWrap}>
            <View style={s.pulseRing} />
            <TouchableOpacity style={s.micBtnActive} onPress={stopListening}>
              <Text style={s.micIcon}>🎙️</Text>
            </TouchableOpacity>
            <Text style={s.listeningText}>Listening...</Text>
          </View>
        ) : (
          <TouchableOpacity style={[s.micBtn, !supported && { opacity: 0.4 }]} onPress={startListening} disabled={!supported}>
            <Text style={s.micIcon}>🎙️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      {transcript.trim() && !isListening && (
        <View style={s.actions}>
          <TouchableOpacity style={s.clearBtn} onPress={clear}>
            <Text style={s.clearText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.sendBtn} onPress={sendText}>
            <Text style={s.sendText}>➤ Send as Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: WHITE, borderRadius: 16, padding: 16, margin: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: DARK },
  close: { fontSize: 20, color: '#999', padding: 4 },
  langLabel: { fontSize: 12, color: TEAL, fontWeight: '500', marginBottom: 10 },
  transcriptBox: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 16, minHeight: 100, marginBottom: 10 },
  transcriptText: { fontSize: 15, color: DARK, lineHeight: 22 },
  interim: { color: '#999', fontStyle: 'italic' },
  placeholder: { fontSize: 14, color: '#BBB', fontStyle: 'italic' },
  error: { fontSize: 13, color: RED, textAlign: 'center', marginBottom: 8 },
  micArea: { alignItems: 'center', paddingVertical: 16 },
  micBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', shadowColor: TEAL, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 },
  micBtnActive: { width: 64, height: 64, borderRadius: 32, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  micIcon: { fontSize: 28 },
  listeningWrap: { alignItems: 'center' },
  pulseRing: { position: 'absolute', width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(229,57,53,0.15)', top: -12 },
  listeningText: { fontSize: 13, color: RED, fontWeight: '500', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 4 },
  clearBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  clearText: { color: '#666', fontWeight: '500', fontSize: 14 },
  sendBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: TEAL },
  sendText: { color: WHITE, fontWeight: '600', fontSize: 14 },
});
