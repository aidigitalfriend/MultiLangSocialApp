import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet, Platform } from 'react-native';

const TEAL = '#00897B';
const TEAL_DARK = '#00695C';
const BG = '#F5F5F5';
const WHITE = '#FFFFFF';
const DARK = '#1A1A2E';

const goTo = (url) => { if (Platform.OS === 'web') window.location.href = url; };

export default function HomeScreen({ navigation }) {
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const scrollRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.measureLayout(
      scrollRef.current,
      (x, y) => scrollRef.current?.scrollTo({ y, animated: true }),
      () => {}
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>V4U</Text>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => scrollTo(aboutRef)}>
            <Text style={styles.navLink}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollTo(featuresRef)}>
            <Text style={styles.navLink}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goTo('https://app.v4u.ai')}>
            <Text style={styles.navLink}>App</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => goTo('https://auth.v4u.ai/signin')}>
            <Text style={styles.headerBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🌍</Text>
          <Text style={styles.heroTitle}>Voice 4U</Text>
          <Text style={styles.heroSub}>
            Break every language barrier. Chat, call, and connect with anyone — your voice, their language.
          </Text>
          <View style={styles.heroBtns}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo('https://auth.v4u.ai/signup')}>
              <Text style={styles.primaryBtnText}>Get Started Free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo('https://app.v4u.ai')}>
              <Text style={styles.secondaryBtnText}>Download App</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View ref={aboutRef} style={styles.section}>
          <Text style={styles.sectionTitle}>About Voice 4U</Text>
          <Text style={styles.sectionText}>
            Voice 4U (V4U) is a real-time multilingual messaging platform. Speak in your language — we translate 
            everything instantly for the listener. Text, voice messages, and live calls are all translated in real-time 
            with AI-powered voice cloning that preserves your unique voice.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>35+</Text>
              <Text style={styles.statLabel}>Languages</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{'<1s'}</Text>
              <Text style={styles.statLabel}>Translation</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>E2E</Text>
              <Text style={styles.statLabel}>Encrypted</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View ref={featuresRef} style={[styles.section, { backgroundColor: WHITE }]}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureGrid}>
            {[
              { icon: '💬', title: 'Instant Translation', desc: 'Messages auto-translate to the receiver\'s language' },
              { icon: '🎙️', title: 'Voice Cloning', desc: 'Your cloned voice speaks in any language naturally' },
              { icon: '📞', title: 'Translated Calls', desc: 'Real-time voice & video calls with live translation' },
              { icon: '👥', title: 'Group Chats', desc: 'Everyone reads messages in their own language' },
              { icon: '🔒', title: 'Private & Secure', desc: 'End-to-end encryption on all conversations' },
              { icon: '🌐', title: 'PWA + Native', desc: 'Use on web, iOS, or Android — same experience' },
            ].map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          {[
            { step: '1', title: 'Sign Up', desc: 'Choose your primary language and create your account' },
            { step: '2', title: 'Clone Your Voice', desc: 'Record a short sample — AI learns your voice' },
            { step: '3', title: 'Start Chatting', desc: 'Send messages & make calls — translation is automatic' },
          ].map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{s.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={[styles.section, styles.ctaSection]}>
          <Text style={styles.ctaTitle}>Ready to break language barriers?</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo('https://auth.v4u.ai/signup')}>
            <Text style={styles.primaryBtnText}>Create Free Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>Voice 4U</Text>
          <Text style={styles.footerDesc}>Real-time multilingual communication for everyone.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => goTo('https://app.v4u.ai')}>
              <Text style={styles.footerLink}>App</Text>
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
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: TEAL_DARK, paddingHorizontal: 20, paddingVertical: 14, ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 100 } : {}) },
  logo: { color: WHITE, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  navLink: { color: '#B2DFDB', fontSize: 15, fontWeight: '500' },
  headerBtn: { backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  headerBtnText: { color: TEAL_DARK, fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  // Hero
  hero: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20, backgroundColor: TEAL },
  heroEmoji: { fontSize: 60, marginBottom: 12 },
  heroTitle: { fontSize: 42, fontWeight: '800', color: WHITE, marginBottom: 12, textAlign: 'center' },
  heroSub: { fontSize: 18, color: '#E0F2F1', textAlign: 'center', maxWidth: 600, marginBottom: 30, lineHeight: 26 },
  heroBtns: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
  primaryBtn: { backgroundColor: WHITE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28 },
  primaryBtnText: { color: TEAL_DARK, fontWeight: '700', fontSize: 16 },
  secondaryBtn: { borderColor: WHITE, borderWidth: 2, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 28 },
  secondaryBtnText: { color: WHITE, fontWeight: '700', fontSize: 16 },
  // Sections
  section: { paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 28, fontWeight: '700', color: DARK, marginBottom: 16, textAlign: 'center' },
  sectionText: { fontSize: 16, color: '#555', textAlign: 'center', maxWidth: 700, lineHeight: 24, marginBottom: 30 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 30, flexWrap: 'wrap', justifyContent: 'center' },
  statBox: { alignItems: 'center', minWidth: 100 },
  statNum: { fontSize: 32, fontWeight: '800', color: TEAL },
  statLabel: { fontSize: 14, color: '#777', marginTop: 4 },
  // Features
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 900 },
  featureCard: { backgroundColor: BG, borderRadius: 16, padding: 24, width: 260, alignItems: 'center' },
  featureIcon: { fontSize: 36, marginBottom: 10 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 6 },
  featureDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, maxWidth: 500, width: '100%' },
  stepCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  stepNum: { color: WHITE, fontWeight: '800', fontSize: 18 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: DARK },
  stepDesc: { fontSize: 14, color: '#666', marginTop: 2 },
  // CTA
  ctaSection: { backgroundColor: TEAL_DARK, alignItems: 'center', paddingVertical: 50 },
  ctaTitle: { fontSize: 26, fontWeight: '700', color: WHITE, marginBottom: 20, textAlign: 'center' },
  // Footer
  footer: { backgroundColor: DARK, paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  footerLogo: { color: TEAL, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  footerDesc: { color: '#999', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 20, justifyContent: 'center' },
  footerLink: { color: '#B2DFDB', fontSize: 14 },
  copyright: { color: '#666', fontSize: 12 },
});