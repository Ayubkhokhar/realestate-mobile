import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';

const C = Colors.light;

export default function BillingScreen() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const token = useAuthStore(s => s.token);
  const settings = useAuthStore(s => s.settings);
  const apiUrl = settings?.bridgeUrl || 'http://192.168.1.100:5000';

  async function fetchInvoices() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInvoices(data.data);
        }
      }
    } catch (e) {
      console.log('Failed to fetch invoices', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, [apiUrl, token]);

  async function handlePay(id: number) {
    Alert.alert('Confirm Payment', 'Mark this invoice as Paid?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Paid', onPress: async () => {
        try {
          const res = await fetch(`${apiUrl}/api/invoices/${id}/pay`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) fetchInvoices();
        } catch (e) {}
      }}
    ]);
  }

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#1e293b' }}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Billing & Invoices</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchInvoices} />}
      >
        <Text style={s.sectionTitle}>Recent Invoices</Text>
        
        {invoices.length === 0 && !loading ? (
          <View style={s.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={C.textMuted} />
            <Text style={s.emptyText}>No invoices found</Text>
          </View>
        ) : (
          invoices.map(inv => (
            <View key={inv.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.invoiceType}>{inv.type === 'rent' ? 'Rental Lease' : 'Installment Plan'}</Text>
                <View style={[s.badge, inv.status === 'Paid' ? s.badgePaid : s.badgePending]}>
                  <Text style={[s.badgeText, inv.status === 'Paid' ? s.badgeTextPaid : s.badgeTextPending]}>
                    {inv.status}
                  </Text>
                </View>
              </View>
              
              <Text style={s.propAddress}>{inv.property_address}</Text>
              <Text style={s.personName}>For: {inv.person_name}</Text>
              
              <View style={s.row}>
                <View>
                  <Text style={s.label}>Amount Due</Text>
                  <Text style={s.amount}>PKR {inv.amount.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={s.label}>Due Date</Text>
                  <Text style={s.date}>{inv.due_date}</Text>
                </View>
              </View>

              {inv.status === 'Pending' && (
                <TouchableOpacity style={s.payBtn} onPress={() => handlePay(inv.id)}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.payBtnText}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter-Bold', color: '#fff' },
  content: { padding: 16, paddingBottom: 80 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#0f172a', marginBottom: 16 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  invoiceType: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgePending: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontFamily: 'Inter-Bold' },
  badgeTextPaid: { color: '#065f46' },
  badgeTextPending: { color: '#991b1b' },

  propAddress: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#0f172a', marginBottom: 4 },
  personName: { fontSize: 13, fontFamily: 'Inter-Medium', color: C.textMuted, marginBottom: 16 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 12, fontFamily: 'Inter-Medium', color: C.textMuted, marginBottom: 4 },
  amount: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#0f172a' },
  date: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#0f172a' },
  
  payBtn: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, gap: 8 },
  payBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter-SemiBold' },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 15, fontFamily: 'Inter-Medium', color: C.textMuted, marginTop: 12 }
});
