import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';

const TEAL = '#00897B';
const TEAL_DARK = '#00695C';
const BG = '#F5F5F5';
const WHITE = '#FFFFFF';
const DARK = '#1A1A2E';

export default function AppScreen({ navigation }) {
  const installPWA = () => {
    if (Platform.OS === 'web' && window.__pwaInstallPrompt) {
      window.__pwaInstallPrompt.prompt();
    } else {
      alert('To install: tap your browser menu → "Add to Home Screen"');
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>V4U</Text>
        </TouchableOpacity>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.navLink}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Signin')}>
            <Text style={styles.headerBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📱</Text>
          <Text style={styles.heroTitle}>Get Voice 4U</Text>
          <Text style={styles.heroSub}>
            Available as a Progressive Web App (PWA) and coming soon to app stores. Use it anywhere — same experience on every device.
          </Text>
        </View>

        {/* PWA Install */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Install Web App (PWA)</Text>
          <Text style={styles.sectionText}>
            No app store needed! Install Voice 4U directly from your browser. Works offline, sends notifications, and feels like a native app.
          </Text>
          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>🌐</Text>
              <Text style={styles.cardTitle}>Chrome / Edge</Text>
              <Text style={styles.cardDesc}>Click the install icon in your address bar, or tap the menu → "Install app"</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>🍎</Text>
              <Text style={styles.cardTitle}>Safari (iOS)</Text>
              <Text style={styles.cardDesc}>Tap Share → "Add to Home Screen" to install as an app icon</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>🤖</Text>
              <Text style={styles.cardTitle}>Android</Text>
              <Text style={styles.cardDesc}>Chrome will prompt you to install automatically, or use the menu</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={installPWA}>
            <Text style={styles.primaryBtnText}>Install Voice 4U</Text>
          </TouchableOpacity>
        </View>

        {/* App Store */}
        <View style={[styles.section, { backgroundColor: WHITE }]}>
          <Text style={styles.sectionTitle}>Native Apps</Text>
          <Text style={styles.sectionText}>
            Native mobile apps coming soon with extra features like background calling and push notifications.
          </Text>
          <View style={styles.storeRow}>
            <TouchableOpacity style={styles.storeBtn} onPress={() => Linking.openURL('https://play.google.com/store')}>
              <Text style={styles.storeIcon}>▶️</Text>
              <View>
                <Text style={styles.storeSmall}>GET IT ON</Text>
                <Text style={styles.storeName}>Google Play</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.storeBtn} onPress={() => Linking.openURL('https://apps.apple.com')}>
              <Text style={styles.storeIcon}>🍎</Text>
              <View>
                <Text style={styles.storeSmall}>DOWNLOAD ON</Text>
                <Text style={styles.storeName}>App Store</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auth Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <View style={styles.authRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.primaryBtnText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('Signin')}>
              <Text style={styles.outlineBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>Voice 4U</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.footerLink}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://v4u.ai/terms')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://v4u.ai/privacy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@v4u.ai')}>
              <Text style={styles.footerLink}>Contact</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copyright}>© 2026 Voice 4U. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: TEAL_DARK, paddingHorizontal: 20, paddingVertical: 14, ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 100 } : {}) },
  logo: { color: WHITE, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  navLink: { color: '#B2DFDB', fontSize: 15, fontWeight: '500' },
  headerBtn: { backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  headerBtnText: { color: TEAL_DARK, fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  // Hero
  hero: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20, backgroundColor: TEAL },
  heroEmoji: { fontSize: 56, marginBottom: 12 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: WHITE, marginBottom: 12 },
  heroSub: { fontSize: 17, color: '#E0F2F1', textAlign: 'center', maxWidth: 600, lineHeight: 25 },
  // Section
  section: { paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 28, fontWeight: '700', color: DARK, marginBottom: 12, textAlign: 'center' },
  sectionText: { fontSize: 16, color: '#555', textAlign: 'center', maxWidth: 600, lineHeight: 24, marginBottom: 30 },
  // Cards
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 30 },
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 24, width: 240, alignItems: 'center' },
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  // Buttons
  primaryBtn: { backgroundColor: TEAL, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28 },
  primaryBtnText: { color: WHITE, fontWeight: '700', fontSize: 16 },
  outlineBtn: { borderColor: TEAL, borderWidth: 2, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 28 },
  outlineBtnText: { color: TEAL, fontWeight: '700', fontSize: 16 },
  // Store
  storeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  storeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: DARK, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  storeIcon: { fontSize: 28 },
  storeSmall: { color: '#999', fontSize: 10, fontWeight: '600' },
  storeName: { color: WHITE, fontSize: 18, fontWeight: '700' },
  // Auth
  authRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  // Footer
  footer: { backgroundColor: DARK, paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  footerLogo: { color: TEAL, fontSize: 20, fontWeight: '800', marginBottom: 16 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 20, justifyContent: 'center' },
  footerLink: { color: '#B2DFDB', fontSize: 14 },
  copyright: { color: '#666', fontSize: 12 },
});
