import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { usePropertyStore } from '../../store/propertyStore';
import { useAuthStore } from '../../store/authStore';

const C = Colors.light;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Simple Pie / Donut Chart ─────────────────────────────────────────────────

interface PieSlice {
  value: number;
  color: string;
  label: string;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function SimplePieChart({ data }: { data: PieSlice[] }) {
  const SIZE = 140;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerR = 58;
  const innerR = 34;

  const total = data.reduce((s, d) => s + d.value, 0);

  let currentAngle = 0;
  const slices = data.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle = endAngle;

    // Full slice path: outer arc → inner arc (donut)
    const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
    const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
    const largeArc = sweep > 180 ? 1 : 0;

    const d = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');

    return { ...slice, d };
  });

  return (
    <View style={styles.pieRow}>
      {/* Chart */}
      <Svg width={SIZE} height={SIZE}>
        <G>
          {slices.map((s, i) => (
            <Path key={i} d={s.d} fill={s.color} />
          ))}
          {/* Center hole highlight */}
          <Circle cx={cx} cy={cy} r={innerR - 2} fill="#FFFFFF" />
        </G>
      </Svg>

      {/* Legend */}
      <View style={styles.pieLegend}>
        {data.map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PIE_DATA: PieSlice[] = [
  { value: 20, color: '#38A169', label: '20 Available' },
  { value: 10, color: '#E53E3E', label: '10 Sold' },
  { value: 2, color: '#D69E2E', label: '2 Reserved' },
];

const RECENT_PROPERTIES = [
  {
    owner: 'Mr. Ali Raza',
    area: '500 sq yd',
    city: 'Lahore',
    price: 'PKR 2.5 Cr',
    status: 'Available',
  },
  {
    owner: 'Mr. Bilal Khan',
    area: '10 Marla',
    city: 'Islamabad',
    price: 'PKR 85 L',
    status: 'Sold',
  },
  {
    owner: 'Mrs. Sara Ahmed',
    area: '5 Marla',
    city: 'Rawalpindi',
    price: 'PKR 45 L',
    status: 'Available',
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const greeting = getGreeting();
  const user = useAuthStore(s => s.user);
  const { stats, properties, loadProperties, loadStats } = usePropertyStore();

  useEffect(() => {
    loadStats();
    loadProperties({ sort: 'newest' });
  }, []);

  const recent = properties.slice(0, 5);

  const pieData: PieSlice[] = [
    { value: stats.available || 1, color: '#38A169', label: `${stats.available} Available` },
    { value: stats.sold || 0,      color: '#E53E3E', label: `${stats.sold} Sold` },
    { value: stats.reserved || 0,  color: '#D69E2E', label: `${stats.reserved} Reserved` },
  ];

  const formatDemand = (p: any) => {
    if (!p.demand) return 'N/A';
    const val = Number(p.demand);
    if (val >= 10000000) return `PKR ${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000)   return `PKR ${(val / 100000).toFixed(0)} L`;
    return `PKR ${val.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}, {user?.name ?? 'Agent'}</Text>
            <Text style={styles.appName}>Real Estate Manager</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? 'A').substring(0, 2).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Stats Grid ──────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: C.statBlue, borderColor: C.statBlueBorder }]}>
            <View style={styles.statTopRow}>
              <Ionicons name="home-outline" size={22} color={C.primary} />
              <Text style={styles.statLabel}>Total Properties</Text>
            </View>
            <Text style={[styles.statNumber, { color: C.primary }]}>{stats.total}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: C.statGreen, borderColor: C.statGreenBorder }]}>
            <View style={styles.statTopRow}>
              <Ionicons name="checkmark-circle-outline" size={22} color={C.success} />
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <Text style={[styles.statNumber, { color: C.success }]}>{stats.available}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: C.statRed, borderColor: C.statRedBorder }]}>
            <View style={styles.statTopRow}>
              <Ionicons name="pricetag-outline" size={22} color={C.danger} />
              <Text style={styles.statLabel}>Sold</Text>
            </View>
            <Text style={[styles.statNumber, { color: C.danger }]}>{stats.sold}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: C.statOrange, borderColor: C.statOrangeBorder }]}>
            <View style={styles.statTopRow}>
              <Ionicons name="time-outline" size={22} color={C.warning} />
              <Text style={styles.statLabel}>Reserved</Text>
            </View>
            <Text style={[styles.statNumber, { color: C.warning }]}>{stats.reserved}</Text>
          </View>
        </View>

        {/* ── Inquiries + Agents ───────────────────────────────── */}
        <View style={styles.inqAgentCard}>
          {/* Inquiries */}
          <View style={styles.inqCell}>
            <Ionicons
              name="help-circle-outline"
              size={26}
              color={C.primary}
              style={styles.inqIcon}
            />
            <Text style={styles.inqLabel}>Inquiries</Text>
            <Text style={styles.inqCount}>0</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Agents */}
          <View style={styles.inqCell}>
            <Ionicons
              name="people-outline"
              size={26}
              color={C.primary}
              style={styles.inqIcon}
            />
            <Text style={styles.inqLabel}>Agents</Text>
            <Text style={styles.inqCount}>1</Text>
          </View>
        </View>

        {/* ── Pie Chart ────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Properties by Status</Text>
          <SimplePieChart data={pieData} />
        </View>

        {/* ── Recent Properties ────────────────────────────────── */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Properties</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: C.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 }}>
                No properties yet. Sync with Desktop to load data.
              </Text>
            </View>
          ) : (
            recent.map((prop, idx) => (
              <TouchableOpacity
                key={prop.id}
                style={styles.propertyItem}
                onPress={() => router.push(`/property/${prop.id}` as any)}
              >
                {prop.images && prop.images.length > 0 ? (
                  <Image
                    source={{ uri: `http://10.233.19.214:5000${prop.images[0]}` }}
                    style={styles.propThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.propThumb}>
                    <Text style={styles.propThumbEmoji}>🏠</Text>
                  </View>
                )}
                <View style={styles.propDetails}>
                  <Text style={styles.propOwnerLabel}>Owner Name</Text>
                  <Text style={styles.propOwnerName}>{prop.owner_name ?? 'Unknown'}</Text>
                  <Text style={styles.propMeta}>
                    {[prop.area_marla ? `${prop.area_marla} Marla` : null, prop.city].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <View style={styles.propRight}>
                  <Text style={styles.propPriceLabel}>Demand Price</Text>
                  <Text style={styles.propPrice}>{formatDemand(prop)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: prop.status === 'Available' ? C.successLight : prop.status === 'Sold' ? C.dangerLight : C.warningLight }]}>
                    <Text style={[styles.statusText, { color: prop.status === 'Available' ? C.success : prop.status === 'Sold' ? C.danger : C.warning }]}>
                      {prop.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2; // 20 padding each side

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
    color: C.text,
    lineHeight: 28,
  },
  appName: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: C.textMuted,
    marginTop: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: C.primary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 16,
  },
  statCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
    flexWrap: 'wrap',
  },
  statNumber: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 30,
  },

  // Inquiries + Agents card
  inqAgentCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  inqCell: {
    flex: 1,
    alignItems: 'center',
  },
  inqIcon: {
    marginBottom: 6,
  },
  inqLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 4,
  },
  inqCount: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 26,
    color: C.text,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: C.border,
    marginHorizontal: 8,
  },

  // Section card (Pie chart)
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: C.text,
    marginBottom: 14,
  },

  // Pie chart
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  pieLegend: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: C.textSecondary,
  },

  // Recent Properties
  recentSection: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAll: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: C.primary,
  },

  // Property item
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
  },
  propThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: C.skeleton,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  propThumbEmoji: {
    fontSize: 28,
  },
  propDetails: {
    flex: 1,
    paddingRight: 8,
  },
  propOwnerLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 2,
  },
  propOwnerName: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: C.text,
    marginBottom: 3,
  },
  propMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: C.textSecondary,
  },
  propRight: {
    alignItems: 'flex-end',
  },
  propPriceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 2,
  },
  propPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: C.text,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
});
