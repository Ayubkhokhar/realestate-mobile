import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const C = Colors.dark;

const MOCK_AGENTS = [
  { id: 1, name: 'Ahmed Ali', email: 'ahmed@test.com', phone: '03001234567', agency: 'AK Realty', status: 'active', permission: 'full', pending: false },
  { id: 2, name: 'Sara Khan', email: 'sara@test.com', phone: '03112345678', agency: 'City Properties', status: 'active', permission: 'view_only', pending: false },
  { id: 3, name: 'Muhammad Zubair', email: 'zubair@test.com', phone: '03223456789', agency: 'AK Realty', status: 'pending', permission: 'full', pending: true },
  { id: 4, name: 'Fatima Noor', email: 'fatima@test.com', phone: '03334567890', agency: 'Prime Estates', status: 'restricted', permission: 'restricted', pending: false },
];

const PERMISSION_OPTIONS = [
  { key: 'full', label: 'Full Access', icon: 'shield-checkmark', color: '#10B981', desc: 'Can add, edit, and delete listings' },
  { key: 'view_only', label: 'View Only', icon: 'eye', color: '#6C63FF', desc: 'Can only browse properties' },
  { key: 'restricted', label: 'Restricted', icon: 'ban', color: '#EF4444', desc: 'Blocked from accessing the app' },
];

export default function AdminScreen() {
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [activeTab, setActiveTab] = useState<'agents' | 'pending'>('agents');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const pending = agents.filter(a => a.pending);
  const active = agents.filter(a => !a.pending);

  const updatePermission = (id: number, permission: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, permission, status: permission === 'restricted' ? 'restricted' : 'active' } : a));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const approveAgent = (id: number) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, pending: false, status: 'active' } : a));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const rejectAgent = (id: number) => {
    Alert.alert('Reject Agent', 'Are you sure you want to reject this registration?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => { setAgents(prev => prev.filter(a => a.id !== id)); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } },
    ]);
  };

  const AgentCard = ({ agent }: { agent: typeof MOCK_AGENTS[0] }) => {
    const isExpanded = expandedId === agent.id;
    const perm = PERMISSION_OPTIONS.find(p => p.key === agent.permission)!;

    return (
      <View style={styles.agentCard}>
        <TouchableOpacity onPress={() => { setExpandedId(isExpanded ? null : agent.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <View style={styles.agentHeader}>
            <LinearGradient colors={['#6C63FF', '#5B52EE']} style={styles.agentAvatar}>
              <Text style={styles.agentInitials}>{agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentEmail}>{agent.email}</Text>
              <Text style={styles.agentPhone}>{agent.phone}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.permBadge, { backgroundColor: perm.color + '22' }]}>
                <Ionicons name={perm.icon as any} size={10} color={perm.color} />
                <Text style={[styles.permBadgeText, { color: perm.color }]}>{perm.label}</Text>
              </View>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandPanel}>
            <Text style={styles.permTitle}>Set Permission</Text>
            <View style={styles.permOptions}>
              {PERMISSION_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.key} onPress={() => updatePermission(agent.id, opt.key)}
                  style={[styles.permOption, agent.permission === opt.key && styles.permOptionActive, { borderColor: agent.permission === opt.key ? opt.color : C.border }]}>
                  <Ionicons name={opt.icon as any} size={16} color={agent.permission === opt.key ? opt.color : C.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.permLabel, agent.permission === opt.key && { color: opt.color }]}>{opt.label}</Text>
                    <Text style={styles.permDesc}>{opt.desc}</Text>
                  </View>
                  {agent.permission === opt.key && <Ionicons name="checkmark-circle" size={18} color={opt.color} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0D0D18']} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Create Agent', 'Agent creation form coming soon')}>
            <Ionicons name="person-add-outline" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Agents', value: agents.length, color: C.primary },
            { label: 'Active', value: active.length, color: '#10B981' },
            { label: 'Pending', value: pending.length, color: '#F59E0B' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([['agents', 'Agents'], ['pending', `Pending (${pending.length})`]] as const).map(([tab, label]) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: Layout.spacing.lg, paddingBottom: 40, gap: 10 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'agents' ? (
            active.map(a => <AgentCard key={a.id} agent={a} />)
          ) : pending.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
              <Text style={styles.emptyTitle}>No Pending Approvals</Text>
            </View>
          ) : pending.map(agent => (
            <View key={agent.id} style={styles.pendingCard}>
              <View style={styles.agentHeader}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.agentAvatar}>
                  <Text style={styles.agentInitials}>{agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentEmail}>{agent.email}</Text>
                  <Text style={styles.agentPhone}>{agent.phone}</Text>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectAgent(agent.id)}>
                  <Ionicons name="close" size={16} color={C.danger} />
                  <Text style={[styles.actionBtnText, { color: C.danger }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => approveAgent(agent.id)}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.spacing.lg, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: 'Inter-Bold' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12 },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryLight, borderRadius: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Layout.spacing.lg, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: C.surfaceElevated, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statValue: { fontSize: 22, fontWeight: '800', fontFamily: 'Inter-ExtraBold' },
  statLabel: { fontSize: 10, color: C.textMuted, fontFamily: 'Inter-Medium', textAlign: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: Layout.spacing.lg, backgroundColor: C.surfaceElevated, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: C.primary },
  tabText: { fontSize: 13, color: C.textMuted, fontFamily: 'Inter-Medium' },
  tabTextActive: { color: '#fff', fontFamily: 'Inter-SemiBold' },
  agentCard: { backgroundColor: C.surfaceElevated, borderRadius: Layout.radius.md, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  agentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Layout.spacing.md },
  agentAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  agentInitials: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter-Bold' },
  agentName: { fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'Inter-SemiBold' },
  agentEmail: { fontSize: 11, color: C.textMuted, fontFamily: 'Inter-Regular', marginTop: 1 },
  agentPhone: { fontSize: 11, color: C.textMuted, fontFamily: 'Inter-Regular' },
  permBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  permBadgeText: { fontSize: 10, fontFamily: 'Inter-SemiBold' },
  expandPanel: { borderTopWidth: 1, borderTopColor: C.border, padding: Layout.spacing.md, gap: 10 },
  permTitle: { fontSize: 12, color: C.textMuted, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  permOptions: { gap: 8 },
  permOption: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.background, borderRadius: 10, borderWidth: 1, padding: 12 },
  permOptionActive: { backgroundColor: 'rgba(108,99,255,0.05)' },
  permLabel: { fontSize: 14, color: '#fff', fontFamily: 'Inter-SemiBold' },
  permDesc: { fontSize: 11, color: C.textMuted, fontFamily: 'Inter-Regular', marginTop: 1 },
  pendingCard: { backgroundColor: C.surfaceElevated, borderRadius: Layout.radius.md, borderWidth: 1, borderColor: '#F59E0B33', overflow: 'hidden' },
  pendingActions: { flexDirection: 'row', gap: 10, padding: 12, paddingTop: 0 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, backgroundColor: '#10B981', borderWidth: 1, borderColor: '#10B981' },
  actionBtnText: { fontSize: 14, color: '#fff', fontFamily: 'Inter-SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#fff', fontFamily: 'Inter-Bold' },
});
