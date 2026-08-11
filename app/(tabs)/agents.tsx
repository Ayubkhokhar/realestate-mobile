import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAuthStore } from '../../store/authStore';

const C = Colors.light;

interface Agent {
  id: string;
  name: string;
  company: string;
  city: string;
  commission: string;
  mobile: string;
  whatsapp: string;
  canAddProperty?: boolean;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Ayub Khokhar',
    company: 'AK Real Estate',
    city: 'Lahore',
    commission: '2%',
    mobile: '+92-300-1234567',
    whatsapp: '+92-300-1234567',
    canAddProperty: true,
  },
  {
    id: '2',
    name: 'Kamran Shah',
    company: 'Shah Properties',
    city: 'Islamabad',
    commission: '1.5%',
    mobile: '+92-311-2345678',
    whatsapp: '+92-311-2345678',
    canAddProperty: false,
  },
  {
    id: '3',
    name: 'Sara Ahmed',
    company: 'Ahmed Realty',
    city: 'Karachi',
    commission: '2.5%',
    mobile: '+92-333-3456789',
    whatsapp: '+92-333-3456789',
    canAddProperty: true,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatWhatsApp(number: string): string {
  // Strip non-digit characters for wa.me URL
  return number.replace(/\D/g, '');
}

function AgentCard({ agent }: { agent: any }) {
  const [canAdd, setCanAdd] = useState(agent.canAddProperty ?? false);
  const user = useAuthStore(s => s.user);

  const handleCall = () => {
    if (!agent.mobile_number) return;
    const tel = agent.mobile_number.replace(/\s/g, '');
    Linking.openURL(`tel:${tel}`);
  };

  const handleWhatsApp = () => {
    if (!agent.whatsapp_number) return;
    const digits = formatWhatsApp(agent.whatsapp_number);
    Linking.openURL(`https://wa.me/${digits}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/agent/${agent.id}`)}
    >
      <View style={styles.cardMainRow}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(agent.name || '?')}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentCompany}>{agent.company_name || 'Independent Agent'}</Text>
          <View style={styles.agentMeta}>
            <Ionicons name="location-outline" size={12} color={C.textMuted} />
            <Text style={styles.agentMetaText}>{agent.city || 'N/A'}</Text>
            {agent.commission_rate && (
              <>
                <View style={styles.metaDot} />
                <Ionicons name="trending-up-outline" size={12} color={C.textMuted} />
                <Text style={styles.agentMetaText}>{agent.commission_rate}%</Text>
              </>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.8}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.waBtn]}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Admin Permission Toggle */}
      {user?.role === 'admin' && (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Permission: Can Add Properties</Text>
          <Switch 
            value={canAdd} 
            onValueChange={setCanAdd} 
            trackColor={{ true: C.primaryLight, false: C.border }} 
            thumbColor={canAdd ? C.primary : '#fff'}
            style={{ transform: [{ scale: 0.8 }] }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function AgentsScreen() {
  const [search, setSearch] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const { apiUrl, token } = useAuthStore.getState();
        const res = await fetch(`${apiUrl}/api/agents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const filtered = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agents</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/add-agent')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Agent</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search agents..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Agent Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} agent{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No agents found</Text>
            <Text style={styles.emptySubtitle}>Try a different search term</Text>
          </View>
        ) : (
          filtered.map((agent) => <AgentCard key={agent.id} agent={agent} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },
  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: Layout.fontSize.xl,
    color: C.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: Layout.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  addBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  // ── Search ──────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginHorizontal: Layout.spacing.md,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: Layout.spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: C.text,
    height: '100%',
  },
  // ── Count row ───────────────────────────────────────────
  countRow: {
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  countText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: C.textSecondary,
  },
  // ── List ────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: 100,
    gap: 12,
  },
  // ── Card ────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
    paddingTop: 12,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: C.textSecondary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: C.primary,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  agentName: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: C.text,
  },
  agentCompany: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: C.textSecondary,
  },
  agentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  agentMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: C.textMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#38A169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waBtn: {
    backgroundColor: '#25D366',
  },
  // ── Empty state ─────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: C.textSecondary,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: C.textMuted,
  },
});
