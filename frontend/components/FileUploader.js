import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { apiUpload } from './api';
import { TEAL, DARK, WHITE, BORDER, RED } from './theme';

const ALLOWED_TYPES = {
  photo: { accept: 'image/*', icon: '🖼️', label: 'Photo' },
  video: { accept: 'video/*', icon: '🎥', label: 'Video' },
  audio: { accept: 'audio/*', icon: '🎵', label: 'Audio' },
  file: { accept: '*/*', icon: '📄', label: 'File' },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function FileUploader({ token, onFileUploaded, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const pickFile = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ALLOWED_TYPES[type]?.accept || '*/*';
    if (type === 'photo') input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large. Max ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        return;
      }
      setSelectedFile({ file, type, name: file.name, size: file.size, mime: file.type });
      setError('');
      // Preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    };
    input.click();
  };

  const upload = async () => {
    if (!selectedFile) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('media', selectedFile.file, selectedFile.name);
      fd.append('type', selectedFile.type);
      const data = await apiUpload('/media', token, fd);
      if (data.url) {
        onFileUploaded({ url: data.url, type: selectedFile.type, name: selectedFile.name, size: selectedFile.size, mime: selectedFile.mime });
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Try again.');
    } finally { setUploading(false); }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={s.container}>
      {/* File type picker */}
      {!selectedFile && (
        <View style={s.picker}>
          <Text style={s.pickerTitle}>Send a file</Text>
          <View style={s.types}>
            {Object.entries(ALLOWED_TYPES).map(([key, val]) => (
              <TouchableOpacity key={key} style={s.typeBtn} onPress={() => pickFile(key)}>
                <Text style={s.typeIcon}>{val.icon}</Text>
                <Text style={s.typeLabel}>{val.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Preview & upload */}
      {selectedFile && (
        <View style={s.previewWrap}>
          {preview && <Image source={{ uri: preview }} style={s.previewImage} resizeMode="contain" />}
          {!preview && (
            <View style={s.fileInfo}>
              <Text style={s.fileIcon}>{ALLOWED_TYPES[selectedFile.type]?.icon || '📄'}</Text>
              <Text style={s.fileName} numberOfLines={2}>{selectedFile.name}</Text>
            </View>
          )}
          <Text style={s.fileSize}>{formatSize(selectedFile.size)}</Text>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <View style={s.actions}>
            <TouchableOpacity style={s.changeBtn} onPress={() => { setSelectedFile(null); setPreview(null); setError(''); }}>
              <Text style={s.changeText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.sendBtn, uploading && { opacity: 0.5 }]} onPress={upload} disabled={uploading}>
              {uploading ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={s.sendText}>➤ Send</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.cancelLink} onPress={onCancel}>
            <Text style={s.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: WHITE, borderRadius: 16, padding: 20, margin: 12, shadowColor: '#000', shadowOffset:{ width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  picker: { alignItems: 'center' },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 20 },
  types: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  typeBtn: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', gap: 4 },
  typeIcon: { fontSize: 26 },
  typeLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  cancelBtn: { marginTop: 20, paddingVertical: 8, paddingHorizontal: 24 },
  cancelText: { color: '#999', fontSize: 14, fontWeight: '500' },
  previewWrap: { alignItems: 'center' },
  previewImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: '#F5F5F5' },
  fileInfo: { alignItems: 'center', marginBottom: 12 },
  fileIcon: { fontSize: 48, marginBottom: 8 },
  fileName: { fontSize: 14, color: DARK, fontWeight: '500', textAlign: 'center', maxWidth: 250 },
  fileSize: { fontSize: 12, color: '#999', marginBottom: 16 },
  error: { fontSize: 13, color: RED, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 12 },
  changeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  changeText: { color: '#666', fontWeight: '500', fontSize: 14 },
  sendBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: TEAL, minWidth: 90, alignItems: 'center' },
  sendText: { color: WHITE, fontWeight: '600', fontSize: 14 },
  cancelLink: { marginTop: 16 },
  cancelLinkText: { color: '#999', fontSize: 13 },
});
