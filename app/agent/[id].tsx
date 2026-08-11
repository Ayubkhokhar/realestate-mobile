import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const C = Colors.light;

const MOCK_AGENTS: Record<string, any> = {
  '1': { id: '1', name: 'Ayub Khokhar', company: 'AK Real Estate', city: 'Lahore', commission: '2%', mobile: '+92-300-1234567', whatsapp: '+92-300-1234567', email: 'ayub@akrealty.pk', cnic: '35202-1234567-1', address: 'DHA Phase 5, Lahore', notes: 'Senior agent with 10+ years of experience.' },
  '2': { id: '2', name: 'Kamran Shah', company: 'Shah Properties', city: 'Islamabad', commission: '1.5%', mobile: '+92-311-2345678', whatsapp: '+92-311-2345678', email: 'kamran@shahprop.pk', cnic: '61101-2345678-2', address: 'F-10, Islamabad', notes: 'Specialist in commercial properties.' },
  '3': { id: '3', name: 'Sara Ahmed', company: 'Ahmed Realty', city: 'Karachi', commission: '2.5%', mobile: '+92-333-3456789', whatsapp: '+92-333-3456789', email: 'sara@ahmedrealty.pk', cnic: '42201-3456789-3', address: 'Clifton, Karachi', notes: 'Expert in luxury residential properties.' },
};

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={16} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const agent = MOCK_AGENTS[id || '1'] || MOCK_AGENTS['1'];

  const handleCall = () => Linking.openURL(`tel:${agent.mobile}`);
  const handleWhatsApp = () => {
    const num = agent.whatsapp.replace(/\D/g, '');
    const msg = `Hi ${agent.name}, I found your profile on Real Estate Manager.`;
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agent Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(agent.name)}</Text>
          </View>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentCompany}>{agent.company}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={C.textMuted} />
            <Text style={styles.agentCity}>{agent.city}</Text>
          </View>
          <View style={styles.commBadge}>
            <Text style={styles.commText}>Commission: {agent.commission}</Text>
          </View>
        </View>

        {/* Contact Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <InfoRow icon="call-outline" label="Mobile" value={agent.mobile} />
          <View style={styles.divider} />
          <InfoRow icon="logo-whatsapp" label="WhatsApp" value={agent.whatsapp} />
          <View style={styles.divider} />
          <InfoRow icon="mail-outline" label="Email" value={agent.email} />
          <View style={styles.divider} />
          <InfoRow icon="card-outline" label="CNIC" value={agent.cnic} />
          <View style={styles.divider} />
          <InfoRow icon="location-outline" label="Address" value={agent.address} />
        </View>

        {/* Notes */}
        {agent.notes ? (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{agent.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 17, fontFamily: 'Inter-Bold', color: C.text },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceElevated, borderRadius: 10 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  profileCard: { backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontFamily: 'Inter-Bold', color: C.primary },
  agentName: { fontSize: 20, fontFamily: 'Inter-ExtraBold', color: C.text, marginBottom: 4 },
  agentCompany: { fontSize: 14, fontFamily: 'Inter-Regular', color: C.textSecondary, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  agentCity: { fontSize: 13, fontFamily: 'Inter-Regular', color: C.textMuted },
  commBadge: { backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  commText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: C.primary },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, backgroundColor: '#38A169', borderRadius: 12 },
  waBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, backgroundColor: '#25D366', borderRadius: 12 },
  actionBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter-Bold' },
  infoCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter-Bold', color: C.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  infoIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, fontFamily: 'Inter-Regular', color: C.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: 'Inter-Medium', color: C.text },
  divider: { height: 1, backgroundColor: C.borderSubtle, marginVertical: 2 },
  notesText: { fontSize: 14, fontFamily: 'Inter-Regular', color: C.textSecondary, lineHeight: 22 },
});
