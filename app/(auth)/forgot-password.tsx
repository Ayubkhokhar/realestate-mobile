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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useSettingsStore } from '../../store/settingsStore';

const C = Colors.light;

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = useSettingsStore(s => s.apiUrl);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      // In production, point this to your actual InfinityFree URL
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', data.message || 'Reset link sent if email exists.');
        setStep(2);
      } else {
        Alert.alert('Error', data.error || 'Failed to request reset code');
      }
    } catch (e) {
      // Fallback for mock environment if backend is unreachable
      Alert.alert('Network Error', 'Could not reach backend. Simulating success for testing.');
      setStep(2);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!token.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please enter the code and your new password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Password has been reset successfully.', [
          { text: 'Login', onPress: () => router.replace('/(auth)') }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to reset password');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not reach backend. Password not reset.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>

          <View style={styles.gap32} />

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code sent to your email and your new password'}
          </Text>

          <View style={styles.gap32} />

          {step === 1 ? (
            <>
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
              <View style={styles.gap24} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestCode} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputRow}>
                <Ionicons name="key-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="6-Digit Reset Code"
                  placeholderTextColor={C.textMuted}
                  value={token}
                  onChangeText={setToken}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.gap12} />
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="New Password"
                  placeholderTextColor={C.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.gap24} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? 'Updating...' : 'Reset Password'}</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  gap32: { height: 32 },
  gap24: { height: 24 },
  gap12: { height: 12 },
  title: { fontSize: 28, fontFamily: 'Inter-Bold', color: C.text },
  subtitle: { fontSize: 14, color: C.textMuted, fontFamily: 'Inter-Regular', marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFFFFF', height: 52, paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, fontFamily: 'Inter-Regular', color: C.text },
  primaryBtn: { width: '100%', height: 52, backgroundColor: C.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-Bold' },
});
