import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';

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
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Please enter a valid email address';
    if (!username.trim()) e.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) e.username = 'Must be 3-20 characters (letters, numbers, underscore only)';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch('https://api.v4u.ai/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), username: username.trim(), password }),
      });
      const data = await response.json();
      if (data.token) {
        if (Platform.OS === 'web') {
          window.location.href = `https://global.v4u.ai#userId=${data.userId}&token=${data.token}`;
        }
      } else {
        if (data.field) {
          setErrors({ [data.field]: data.error });
        } else {
          setErrors({ general: data.error || 'Signup failed. Please try again.' });
        }
      }
    } catch (e) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
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

          {errors.general ? <Text style={styles.errorBanner}>{errors.general}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="you@example.com" value={email} onChangeText={(t) => { setEmail(t); setErrors(e => ({...e, email: undefined})); }} keyboardType="email-address" autoCapitalize="none" />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <Text style={styles.label}>Username</Text>
          <TextInput style={[styles.input, errors.username && styles.inputError]} placeholder="3-20 chars (letters, numbers, _)" value={username} onChangeText={(t) => { setUsername(t); setErrors(e => ({...e, username: undefined})); }} autoCapitalize="none" />
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="Min 6 characters" value={password} onChangeText={(t) => { setPassword(t); setErrors(e => ({...e, password: undefined})); }} secureTextEntry />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={[styles.input, errors.confirmPassword && styles.inputError]} placeholder="Re-enter password" value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({...e, confirmPassword: undefined})); }} secureTextEntry />
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

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
  inputError: { borderColor: '#D32F2F' },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },
  errorBanner: { color: '#D32F2F', fontSize: 14, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 12, textAlign: 'center' },
  btn: { backgroundColor: TEAL, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: '#888', fontSize: 14 },
  switchLink: { color: TEAL, fontSize: 14, fontWeight: '700' },
});