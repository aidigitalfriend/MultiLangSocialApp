import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';

const TEAL = '#00897B';
const TEAL_DARK = '#00695C';
const WHITE = '#FFFFFF';
const DARK = '#1A1A2E';
const BG = '#F5F5F5';

const goTo = (url) => { if (Platform.OS === 'web') window.location.href = url; };

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://api.v4u.ai/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json();
      if (data.token) {
        if (Platform.OS === 'web') {
          window.location.href = `https://global.v4u.ai#userId=${data.userId}&token=${data.token}`;
        }
      } else {
        Alert.alert('Error', data.error || 'Signup failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goTo('https://v4u.ai')}>
          <Text style={styles.logo}>V4U</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Voice 4U and start chatting in any language</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} placeholder="Choose a username" value={username} onChangeText={setUsername} autoCapitalize="none" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Min 6 characters" value={password} onChangeText={setPassword} secureTextEntry />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSignup} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signin')}>
              <Text style={styles.switchLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { backgroundColor: TEAL_DARK, paddingHorizontal: 20, paddingVertical: 14 },
  logo: { color: WHITE, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: WHITE, borderRadius: 20, padding: 30, width: '100%', maxWidth: 440, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(0,0,0,0.08)' } : { elevation: 4 }) },
  title: { fontSize: 26, fontWeight: '700', color: DARK, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: BG, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  btn: { backgroundColor: TEAL, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: '#888', fontSize: 14 },
  switchLink: { color: TEAL, fontSize: 14, fontWeight: '700' },
});