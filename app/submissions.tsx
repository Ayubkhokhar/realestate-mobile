import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { getDatabase } from '../store/database';

const C = Colors.light;

type Submission = {
  local_id: number;
  owner_name: string;
  property_type: string;
  city: string;
  demand: number;
  status: string;
  push_status: string;
  created_at: string;
};

export default function SubmissionsScreen() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const db = await getDatabase();
        const rows = await db.getAllAsync<Submission>(
          `SELECT local_id, owner_name, property_type, city, demand, status, push_status, created_at 
           FROM pending_submissions ORDER BY local_id DESC`
        );
        setSubmissions(rows);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStatusBadge = (pushStatus: string, status: string) => {
    if (pushStatus === 'pending') {
      return (
        <View style={[styles.badge, { backgroundColor: C.warningLight }]}>
          <Text style={[styles.badgeText, { color: C.warning }]}>Offline Queued</Text>
        </View>
      );
    }
    if (status === 'approved') {
      return (
        <View style={[styles.badge, { backgroundColor: C.successLight }]}>
          <Text style={[styles.badgeText, { color: C.success }]}>Approved</Text>
        </View>
      );
    }
    if (status === 'rejected') {
      return (
        <View style={[styles.badge, { backgroundColor: C.dangerLight }]}>
          <Text style={[styles.badgeText, { color: C.danger }]}>Rejected</Text>
        </View>
      );
    }
    
    // Default submitted state
    return (
      <View style={[styles.badge, { backgroundColor: C.primaryLight }]}>
        <Text style={[styles.badgeText, { color: C.primary }]}>Submitted</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Submissions</Text>
          <View style={{ width: 44 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {submissions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="document-text-outline" size={64} color={C.border} />
                <Text style={styles.emptyTitle}>No Submissions</Text>
                <Text style={styles.emptyText}>You haven't submitted any properties yet.</Text>
              </View>
            ) : (
              submissions.map(sub => (
                <View key={sub.local_id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{sub.owner_name}</Text>
                    {getStatusBadge(sub.push_status, sub.status)}
                  </View>
                  <Text style={styles.cardSubtitle}>
                    {sub.property_type} {sub.city ? `• ${sub.city}` : ''}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>{sub.created_at}</Text>
                    {sub.demand ? (
                      <Text style={styles.cardPrice}>
                        PKR {sub.demand.toLocaleString()}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.background,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: C.text },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
  },
  scrollContent: { padding: Layout.spacing.lg, gap: 12 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: C.text,
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: C.textSecondary,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: C.textMuted,
  },
  cardPrice: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: C.text,
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: C.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: C.textMuted,
    textAlign: 'center',
  },
});
