import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { registerForPushNotificationsAsync } from '../../utils/notifications';

const C = Colors.light;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const apiUrl = useSettingsStore(s => s.apiUrl);
  const setApiUrl = useSettingsStore(s => s.setApiUrl);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiUrl);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    let pushToken = null;
    try {
      pushToken = await registerForPushNotificationsAsync();
    } catch (e) {
      console.warn('Push registration failed:', e);
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, push_token: pushToken })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setAuth(data.data.token, data.data.user);
        router.replace('/(tabs)');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (e) {
      alert('Network Error: Could not connect to backend.');
    }
    setLoading(false);
  };

  const testLogin = (role: 'admin'|'agent', permission: 'full'|'view_only') => {
    // Left for debugging purposes
    setAuth('mock-token', {
      id: role === 'admin' ? 1 : (permission === 'full' ? 2 : 3),
      name: role === 'admin' ? 'Admin' : `Agent (${permission})`,
      email: `${role}@test.com`,
      phone: '123',
      role, status: 'active', permission
    } as any);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Settings Icon (Absolute Top Right) */}
          <TouchableOpacity 
            style={styles.settingsBtn} 
            onPress={() => { setTempUrl(apiUrl); setSettingsVisible(true); }}
          >
            <Ionicons name="settings-outline" size={24} color={C.textMuted} />
          </TouchableOpacity>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>RE</Text>
            </View>
            <Text style={styles.logoLabel}>Real Estate Manager</Text>
          </View>

          <View style={styles.gap40} />

          {/* Header */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.gap32} />

          {/* Email Input */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email Address"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.gap12} />

          {/* Password Input */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.gap8} />

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotContainer} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.gap24} />

          {/* Login Button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.gap24} />

          <View style={styles.gap24} />

          {/* Test Buttons */}
          <Text style={{ textAlign: 'center', color: C.textMuted, marginBottom: 8, fontSize: 12 }}>Test RBAC Logins:</Text>
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => testLogin('admin', 'full')}
              activeOpacity={0.7}
            >
              <Text style={styles.testBtnText}>Login as Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: C.surfaceElevated, borderWidth: 1, borderColor: C.border }]}
              onPress={() => testLogin('agent', 'full')}
              activeOpacity={0.7}
            >
              <Text style={[styles.testBtnText, { color: C.text }]}>Agent (Can Add Properties)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: C.surfaceElevated, borderWidth: 1, borderColor: C.border }]}
              onPress={() => testLogin('agent', 'view_only')}
              activeOpacity={0.7}
            >
              <Text style={[styles.testBtnText, { color: C.text }]}>Agent (View Only)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* API Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>API Server URL</Text>
            <Text style={styles.inputLabel}>Enter Backend Address:</Text>
            <TextInput
              style={styles.modalInput}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder="http://192.168.1.x:5000"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setSettingsVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={() => {
                setApiUrl(tempUrl.trim());
                setSettingsVisible(false);
              }}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  logoLabel: {
    marginTop: 8,
    color: C.textMuted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  gap40: { height: 40 },
  gap32: { height: 32 },
  gap24: { height: 24 },
  gap16: { height: 16 },
  gap12: { height: 12 },
  gap8: { height: 8 },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: C.text,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  forgotContainer: {
    alignItems: 'flex-end',
  },
  forgotText: {
    color: C.primary,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  loginBtn: {
    width: '100%',
    height: 52,
    backgroundColor: C.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    color: C.textMuted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  linkText: {
    color: C.primary,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  testBtn: {
    alignItems: 'center',
  },
  testBtnText: {
    color: C.textMuted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  settingsBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20, fontFamily: 'Inter-Bold', color: C.text, marginBottom: 20, textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12, fontFamily: 'Inter-SemiBold', color: C.textMuted, marginBottom: 6,
  },
  modalInput: {
    height: 48, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, fontFamily: 'Inter-Regular', color: C.text, backgroundColor: '#F7FAFC',
  },
  modalBtnRow: {
    flexDirection: 'row', gap: 12, marginTop: 24,
  },
  modalBtn: {
    flex: 1, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1, borderColor: C.border, backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: C.primary,
  },
  cancelBtnText: {
    fontSize: 14, fontFamily: 'Inter-SemiBold', color: C.textMuted,
  },
  saveBtnText: {
    fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF',
  },
});
