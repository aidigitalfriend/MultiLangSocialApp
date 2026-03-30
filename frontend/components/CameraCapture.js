import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { apiUpload } from './api';
import { TEAL, DARK, WHITE, RED, BORDER } from './theme';

export default function CameraCapture({ token, onCapture, onCancel }) {
  const [mode, setMode] = useState('photo'); // photo | video
  const [facing, setFacing] = useState('user'); // user | environment
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(null); // { blob, url, type }
  const [recording, setRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facing]);

  const startCamera = async () => {
    stopCamera();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setError('');
    } catch {
      setError('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setCaptured({ blob, url: URL.createObjectURL(blob), type: 'photo', mime: 'image/jpeg' });
        stopCamera();
      }
    }, 'image/jpeg', 0.85);
  };

  const startRecordingVideo = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setCaptured({ blob, url: URL.createObjectURL(blob), type: 'video', mime: 'video/webm' });
      stopCamera();
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setRecDuration(0);
    timerRef.current = setInterval(() => {
      setRecDuration(prev => {
        if (prev >= 120) { stopRecordingVideo(); return 120; }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecordingVideo = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const retake = () => {
    setCaptured(null);
    setError('');
    startCamera();
  };

  const send = async () => {
    if (!captured) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      const ext = captured.type === 'photo' ? 'jpg' : 'webm';
      fd.append('media', captured.blob, `camera_${Date.now()}.${ext}`);
      fd.append('type', captured.type === 'photo' ? 'image' : 'video');
      const data = await apiUpload('/media', token, fd);
      if (data.url) {
        onCapture({ url: data.url, type: captured.type === 'photo' ? 'image' : 'video' });
      } else { setError(data.error || 'Upload failed'); }
    } catch { setError('Upload failed'); } finally { setUploading(false); }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={s.overlay}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => { stopCamera(); onCancel(); }}>
            <Text style={s.close}>✕</Text>
          </TouchableOpacity>
          {!captured && (
            <View style={s.modeTabs}>
              <TouchableOpacity style={[s.modeTab, mode === 'photo' && s.modeActive]} onPress={() => setMode('photo')}>
                <Text style={[s.modeText, mode === 'photo' && s.modeTextActive]}>📷 Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modeTab, mode === 'video' && s.modeActive]} onPress={() => { setMode('video'); startCamera(); }}>
                <Text style={[s.modeText, mode === 'video' && s.modeTextActive]}>🎥 Video</Text>
              </TouchableOpacity>
            </View>
          )}
          {!captured && (
            <TouchableOpacity onPress={() => setFacing(f => f === 'user' ? 'environment' : 'user')}>
              <Text style={s.flipIcon}>🔄</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Camera / Preview */}
        <View style={s.viewfinder}>
          {captured ? (
            captured.type === 'photo' ? (
              <Image source={{ uri: captured.url }} style={s.preview} resizeMode="contain" />
            ) : (
              <video src={captured.url} controls style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }} />
            )
          ) : (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
          )}

          {recording && (
            <View style={s.recOverlay}>
              <View style={s.recDot} />
              <Text style={s.recTime}>{fmt(recDuration)}</Text>
            </View>
          )}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {/* Controls */}
        <View style={s.controls}>
          {!captured ? (
            mode === 'photo' ? (
              <TouchableOpacity style={s.captureBtn} onPress={takePhoto}>
                <View style={s.captureBtnInner} />
              </TouchableOpacity>
            ) : (
              recording ? (
                <TouchableOpacity style={s.stopRecBtn} onPress={stopRecordingVideo}>
                  <View style={s.stopRecInner} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.captureBtn} onPress={startRecordingVideo}>
                  <View style={[s.captureBtnInner, { backgroundColor: RED }]} />
                </TouchableOpacity>
              )
            )
          ) : (
            <View style={s.postActions}>
              <TouchableOpacity style={s.retakeBtn} onPress={retake}>
                <Text style={s.retakeText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sendBtn, uploading && { opacity: 0.5 }]} onPress={send} disabled={uploading}>
                {uploading ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={s.sendText}>➤ Send</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1000 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, zIndex: 10 },
  close: { fontSize: 24, color: WHITE, padding: 4 },
  modeTabs: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 3 },
  modeTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 17 },
  modeActive: { backgroundColor: WHITE },
  modeText: { fontSize: 13, color: '#CCC', fontWeight: '500' },
  modeTextActive: { color: DARK },
  flipIcon: { fontSize: 22, padding: 4 },
  viewfinder: { flex: 1, backgroundColor: '#111', overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  recOverlay: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: RED },
  recTime: { color: WHITE, fontSize: 16, fontWeight: '700' },
  error: { color: RED, fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  controls: { paddingVertical: 24, alignItems: 'center' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  captureBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: WHITE },
  stopRecBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: RED, alignItems: 'center', justifyContent: 'center' },
  stopRecInner: { width: 28, height: 28, borderRadius: 4, backgroundColor: RED },
  postActions: { flexDirection: 'row', gap: 20 },
  retakeBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  retakeText: { color: WHITE, fontWeight: '500', fontSize: 15 },
  sendBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, backgroundColor: TEAL, minWidth: 100, alignItems: 'center' },
  sendText: { color: WHITE, fontWeight: '600', fontSize: 15 },
});
