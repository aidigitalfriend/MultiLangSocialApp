import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';

const TEAL = '#00897B';
const TEAL_DARK = '#00695C';
const WHITE = '#FFFFFF';
const DARK = '#1A1A2E';
const BG = '#F5F5F5';

export default function ResetPasswordScreen({ navigation }) {
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://api.v4u.ai/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Code Sent', 'A reset code has been sent to your email');
        setStep('reset');
      } else {
        Alert.alert('Error', data.error || 'Could not send reset code');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://api.v4u.ai/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Password has been reset successfully', [
          { text: 'Sign In', onPress: () => navigation.navigate('Signin') },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Reset failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (Platform.OS === 'web') window.location.href = 'https://v4u.ai'; }}>
          <Text style={styles.logo}>V4U</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>{step === 'request' ? 'Forgot Password?' : 'Reset Password'}</Text>
          <Text style={styles.subtitle}>
            {step === 'request'
              ? 'Enter your email and we\'ll send you a reset code'
              : 'Enter the code and your new password'}
          </Text>

          {step === 'request' ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRequestReset} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Reset Code</Text>
              <TextInput style={styles.input} placeholder="Enter 6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />

              <Text style={styles.label}>New Password</Text>
              <TextInput style={styles.input} placeholder="Min 6 characters" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput style={styles.input} placeholder="Re-enter new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('request')} style={{ marginTop: 12 }}>
                <Text style={styles.resendText}>Didn't receive code? Send again</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Remember your password? </Text>
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
  resendText: { color: TEAL, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: '#888', fontSize: 14 },
  switchLink: { color: TEAL, fontSize: 14, fontWeight: '700' },
});
