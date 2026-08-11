import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAuthStore } from '../../store/authStore';

const C = Colors.dark;

export default function PendingScreen() {
  const { t } = useTranslation();
  const { clearAuth } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A', '#1a1040']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']} style={styles.iconCircle}>
            <Ionicons name="time-outline" size={52} color={C.primary} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>{t('auth.pendingTitle')}</Text>
        <View style={styles.goldLine} />
        <Text style={styles.message}>{t('auth.pendingMessage')}</Text>
        <Text style={styles.subMessage}>{t('auth.pendingSubMessage')}</Text>

        <View style={styles.stepsCard}>
          {[
            { icon: 'checkmark-circle', text: 'Registration submitted', done: true },
            { icon: 'time', text: 'Admin reviewing your account', done: false },
            { icon: 'lock-open', text: 'Access granted', done: false },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <Ionicons name={step.icon as any} size={20} color={step.done ? C.success : C.textMuted} />
              <Text style={[styles.stepText, step.done && { color: C.success }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => { clearAuth(); router.replace('/(auth)'); }}>
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.spacing.xl },
  iconWrap: { marginBottom: 24 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', fontFamily: 'Inter-ExtraBold' },
  goldLine: { width: 50, height: 2, backgroundColor: '#FFD700', borderRadius: 2, marginVertical: 14 },
  message: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, fontFamily: 'Inter-Regular' },
  subMessage: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 6, fontFamily: 'Inter-Regular' },
  stepsCard: { marginTop: 28, backgroundColor: 'rgba(28,28,38,0.9)', borderRadius: 16, padding: Layout.spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 14, width: '100%' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepText: { fontSize: 14, color: C.textMuted, fontFamily: 'Inter-Medium' },
  logoutBtn: { marginTop: 28, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  logoutText: { color: C.textSecondary, fontSize: 14, fontFamily: 'Inter-Medium' },
});
