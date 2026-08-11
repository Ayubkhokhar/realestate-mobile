import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

const C = Colors.light;

// ─── Icon color map for each row ─────────────────────────────────────────────
const ICON_COLORS: Record<string, { bg: string; icon: string }> = {
  'person-outline':               { bg: '#EBF8FF', icon: '#3182CE' },
  'lock-closed-outline':          { bg: '#FFF5F5', icon: '#E53E3E' },
  'language-outline':             { bg: '#F0FFF4', icon: '#38A169' },
  'notifications-outline':        { bg: '#FFFAF0', icon: '#D69E2E' },
  'document-text-outline':        { bg: '#EBF8FF', icon: '#3182CE' },
  'shield-outline':               { bg: '#F0FFF4', icon: '#38A169' },
  'information-circle-outline':   { bg: '#EDF2F7', icon: '#718096' },
  'moon-outline':                 { bg: '#EDF2F7', icon: '#4A5568' },
};

// ─── Setting Row ──────────────────────────────────────────────────────────────
interface SettingRowProps {
  icon: string;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
}

function SettingRow({ icon, label, right, onPress, showDivider }: SettingRowProps) {
  const colors = ICON_COLORS[icon] ?? { bg: C.primaryLight, icon: C.primary };
  return (
    <>
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
          <Ionicons name={icon as any} size={18} color={colors.icon} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowRight}>{right}</View>
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const { language, setLanguage, notificationsEnabled, setNotifications, theme, setTheme } = useSettingsStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const handleEditProfile = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and Email are required.');
      return;
    }
    updateUser({ name, email, phone });
    setEditModalVisible(false);
    Alert.alert('Success', 'Profile updated successfully.');
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    // Success mock
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(false);
    Alert.alert('Success', 'Password changed successfully.');
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language / اپنی زبان منتخب کریں',
      [
        { text: 'English', onPress: () => setLanguage('en') },
        { text: 'اردو (Urdu)', onPress: () => setLanguage('ur') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/(auth)'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* ── Profile Card ── */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(user?.name || 'Agent')}</Text>
            </View>
            <Text style={styles.profileName}>{user?.name || 'Agent'}</Text>
            <Text style={styles.profileRole}>Real Estate Manager</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@realestate.com'}</Text>
          </View>

          {/* ── Account ── */}
          <SectionCard title="Account">
            <SettingRow
              icon="document-text-outline"
              label="My Submissions"
              right={<Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
              onPress={() => router.push('/submissions')}
              showDivider
            />
            <SettingRow
              icon="person-outline"
              label="Edit Profile"
              right={<Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
              onPress={() => {
                setName(user?.name || '');
                setEmail(user?.email || '');
                setPhone(user?.phone || '');
                setEditModalVisible(true);
              }}
              showDivider
            />
            <SettingRow
              icon="lock-closed-outline"
              label="Change Password"
              right={<Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
              onPress={() => setPasswordModalVisible(true)}
            />
          </SectionCard>

          {/* ── Preferences ── */}
          <SectionCard title="Preferences">
            <SettingRow
              icon="language-outline"
              label="Language"
              right={<Text style={styles.rowValue}>{language === 'ur' ? 'اردو' : 'English'}</Text>}
              onPress={handleLanguageChange}
              showDivider
            />
            <SettingRow
              icon="moon-outline"
              label="Dark Mode"
              right={
                <Switch
                  value={theme === 'dark'}
                  onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                  trackColor={{ true: C.primary, false: C.border }}
                  thumbColor="#fff"
                />
              }
              showDivider
            />
            <SettingRow
              icon="notifications-outline"
              label="Notifications"
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotifications}
                  trackColor={{ true: C.primary, false: C.border }}
                  thumbColor="#fff"
                />
              }
            />
          </SectionCard>

          {/* ── About ── */}
          <SectionCard title="About">
            <SettingRow
              icon="document-text-outline"
              label="Terms of Service"
              right={<Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
              onPress={() => router.push('/terms')}
              showDivider
            />
            <SettingRow
              icon="shield-outline"
              label="Privacy Policy"
              right={<Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
              onPress={() => router.push('/privacy')}
              showDivider
            />
            <SettingRow
              icon="information-circle-outline"
              label="App Version"
              right={<Text style={styles.rowValue}>v1.0.0</Text>}
            />
          </SectionCard>

          {/* ── Logout ── */}
          <View style={{ paddingHorizontal: Layout.spacing.lg, marginTop: 24 }}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <Text style={styles.footerText}>
            {'Real Estate Manager Pro © 2026\nDeveloped by Ayub Khokhar'}
          </Text>

        </ScrollView>
      </SafeAreaView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor="#A0AEC0"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Email Address"
              placeholderTextColor="#A0AEC0"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Phone Number"
              placeholderTextColor="#A0AEC0"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleEditProfile}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Text style={styles.inputLabel}>Old Password</Text>
            <TextInput
              style={styles.modalInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor="#A0AEC0"
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Enter new password"
              placeholderTextColor="#A0AEC0"
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor="#A0AEC0"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordModalVisible(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-ExtraBold',
    color: C.text,
  },

  // Profile card
  profileCard: {
    marginHorizontal: Layout.spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
    ...CARD_SHADOW,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22, fontFamily: 'Inter-ExtraBold', color: C.primary,
  },
  profileName: {
    fontSize: 18, fontFamily: 'Inter-Bold', color: C.text, marginBottom: 4,
  },
  profileRole: {
    fontSize: 13, fontFamily: 'Inter-Medium', color: C.textMuted, marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13, fontFamily: 'Inter-Regular', color: C.textMuted,
  },

  // Section
  sectionWrap: {
    paddingHorizontal: Layout.spacing.lg,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12, fontFamily: 'Inter-SemiBold',
    color: C.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: {
    flex: 1, fontSize: 15, fontFamily: 'Inter-Medium', color: C.text,
  },
  rowRight: {
    alignItems: 'center', justifyContent: 'center',
  },
  rowValue: {
    fontSize: 13, fontFamily: 'Inter-Regular', color: C.textMuted,
  },

  divider: { height: 1, backgroundColor: C.border, marginLeft: 64 },

  // Logout
  logoutBtn: {
    height: 50, borderRadius: 12,
    borderWidth: 1, borderColor: C.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16, fontFamily: 'Inter-SemiBold', color: C.danger,
  },

  // Footer
  footerText: {
    textAlign: 'center', color: C.textMuted,
    fontSize: 11, fontFamily: 'Inter-Regular',
    paddingTop: 24, paddingBottom: 8, lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: C.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: C.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: C.text,
    backgroundColor: '#F7FAFC',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: C.primary,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: C.textSecondary,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
