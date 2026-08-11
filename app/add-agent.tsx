import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const C = Colors.light;

// ── Reusable field components ────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  multiline?: boolean;
  inputHeight?: number;
}

function Field({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  inputHeight,
}: FieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && { height: inputHeight ?? 90, textAlignVertical: 'top', paddingTop: 12 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCorrect={false}
      />
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function AddAgentScreen() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [commission, setCommission] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    Alert.alert('Agent saved! (Mock)', '', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Agent</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Scrollable form ── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Agent Full Name — full width */}
            <Field
              label="Agent Full Name"
              required
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ayub Khokhar"
            />

            {/* Company | City — side by side */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Field
                  label="Company / Agency Name"
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company name"
                />
              </View>
              <View style={styles.halfField}>
                <Field
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                />
              </View>
            </View>

            {/* Mobile | WhatsApp — side by side */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Field
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="+92-300-0000000"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.halfField}>
                <Field
                  label="WhatsApp Number"
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  placeholder="+92-300-0000000"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email | CNIC — side by side */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Field
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.halfField}>
                <Field
                  label="CNIC Number"
                  value={cnic}
                  onChangeText={setCnic}
                  placeholder="XXXXX-XXXXXXX-X"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Commission — full width */}
            <Field
              label="Commission Rate (%)"
              value={commission}
              onChangeText={setCommission}
              placeholder="e.g. 2"
              keyboardType="numeric"
            />

            {/* Address — multiline */}
            <Field
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Street address, area..."
              multiline
              inputHeight={90}
            />

            {/* Notes — multiline */}
            <Field
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              multiline
              inputHeight={90}
            />
          </View>
        </ScrollView>

        {/* ── Sticky Save button ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Agent</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: Layout.fontSize.md,
    color: C.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 38,
  },
  // Scroll
  scrollContent: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: 20,
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  // Row layout
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  // Field
  fieldWrapper: {
    gap: 4,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 4,
  },
  required: {
    color: C.danger,
    fontFamily: 'Inter-Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  // Footer
  footer: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 12,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 12,
    height: 52,
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
