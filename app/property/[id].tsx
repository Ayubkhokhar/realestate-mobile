import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Linking, Share, Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Video, ResizeMode, VideoFullscreenUpdate } from 'expo-av';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

const { width } = Dimensions.get('window');
const C = Colors.light;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(amount: number, currency = 'PKR') {
  if (amount >= 10000000) return `${currency} ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${currency} ${(amount / 100000).toFixed(1)} L`;
  return `${currency} ${amount.toLocaleString()}`;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Available: { bg: '#F0FFF4', text: C.success, border: '#C6F6D5' },
  Reserved:  { bg: '#FFFAF0', text: C.warning, border: '#FEEBC8' },
  Sold:      { bg: '#FFF5F5', text: C.danger,  border: '#FED7D7' },
};

import { usePropertyStore } from '../../store/propertyStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const properties = usePropertyStore(s => s.properties);
  const apiUrl = useSettingsStore(s => s.apiUrl);

  // Handle both numeric IDs (synced) and string "pending_X" IDs (offline)
  const property = properties.find(p => String(p.id) === String(id)) ?? null;
  const [saved, setSaved] = useState(false);
  const videoRef = useRef<Video>(null);

  if (!property) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={64} color={C.textMuted} />
        <Text style={{ fontSize: 18, fontFamily: 'Inter-Bold', color: C.text, marginTop: 16, textAlign: 'center' }}>Property Not Found</Text>
        <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: 'Inter-Regular', marginTop: 8, textAlign: 'center' }}>This property may have been removed or not yet synced.</Text>
        <TouchableOpacity style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.primary, borderRadius: 12 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontFamily: 'Inter-Bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRent  = property.purpose === 'rent';
  const statusCfg = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.Available;

  const hasBuildingInfo =
    (property.beds > 0) || (property.baths > 0) ||
    (property.kitchens > 0) || (property.parking > 0);

  const handleCall = () => Linking.openURL(`tel:${property.mobile_number}`);

  const handleWhatsApp = () => {
    const num = property.mobile_number.replace(/[^0-9]/g, '');
    const msg = `Hi, I'm interested in your property: ${property.title} – ${formatPrice(property.demand)}`;
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
  };

  const handleShare = async () => {
    await Share.share({
      title: property.title,
      message: `🏠 ${property.title}\n📍 ${property.city}\n💰 ${formatPrice(property.demand)}\n📐 ${property.area_marla} Marla\n\nShared via Real Estate Manager Pro`,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {property.images && property.images.length > 0 ? (
            <Image
              source={{ uri: property.images[0].startsWith('http') ? property.images[0] : `${apiUrl}${property.images[0]}` }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ fontSize: 64 }}>🏠</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', '#FFFFFF']}
            style={styles.heroOverlay}
          />
        </View>

        {/* ── Floating header buttons (absolute) ── */}
        <View style={styles.floatingBtns}>
          <TouchableOpacity style={styles.floatBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.floatingRight}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => setSaved(s => !s)}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? '#F59E0B' : C.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>

          {/* Purpose + Status badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.purposeBadge]}>
              <Text style={styles.purposeText}>{isRent ? 'FOR RENT' : 'FOR SALE'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.text }]} />
              <Text style={[styles.statusText, { color: statusCfg.text }]}>{property.status}</Text>
            </View>
          </View>

          {/* Title + Address */}
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={C.textMuted} />
            <Text style={styles.address}>{property.address}</Text>
          </View>

          {/* Price Card */}
          <View style={styles.priceCard}>
            {isRent ? (
              <>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceLabel}>Monthly Rent</Text>
                    <Text style={styles.priceAmount}>{formatPrice(property.demand, property.demand_currency)}</Text>
                  </View>
                  {property.rent_deposit ? (
                    <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: C.border, paddingLeft: 16 }}>
                      <Text style={styles.priceLabel}>Security Deposit</Text>
                      <Text style={[styles.priceAmount, { fontSize: 18 }]}>{formatPrice(property.rent_deposit, property.demand_currency)}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.priceLabel}>Asking Price</Text>
                <Text style={styles.priceAmount}>{formatPrice(property.demand, property.demand_currency)}</Text>
              </>
            )}
          </View>

          {/* Specs Row */}
          <View style={styles.specsRow}>
            {[
              { icon: 'resize-outline',   label: 'Area',  value: `${property.area_marla} Marla` },
              { icon: 'grid-outline',     label: 'Sqft',  value: `${property.area_sqft?.toFixed(0) ?? '—'}` },
              { icon: 'home-outline',     label: 'Type',  value: property.property_type },
              { icon: 'location-outline', label: 'City',  value: property.city },
            ].map((spec, i) => (
              <View key={i} style={styles.specCard}>
                <View style={styles.specIconBox}>
                  <Ionicons name={spec.icon as any} size={15} color={C.primary} />
                </View>
                <Text style={styles.specValue} numberOfLines={1}>{spec.value}</Text>
                <Text style={styles.specLabel}>{spec.label}</Text>
              </View>
            ))}
          </View>

          {/* Building Info — conditional */}
          {hasBuildingInfo && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Building Info</Text>
              <View style={styles.buildingRow}>
                {property.beds > 0 && (
                  <View style={styles.buildingChip}>
                    <Ionicons name="bed-outline" size={18} color={C.primary} />
                    <Text style={styles.buildingCount}>{property.beds}</Text>
                    <Text style={styles.buildingLabel}>Beds</Text>
                  </View>
                )}
                {property.baths > 0 && (
                  <View style={styles.buildingChip}>
                    <Ionicons name="water-outline" size={18} color={C.primary} />
                    <Text style={styles.buildingCount}>{property.baths}</Text>
                    <Text style={styles.buildingLabel}>Baths</Text>
                  </View>
                )}
                {property.kitchens > 0 && (
                  <View style={styles.buildingChip}>
                    <Ionicons name="restaurant-outline" size={18} color={C.primary} />
                    <Text style={styles.buildingCount}>{property.kitchens}</Text>
                    <Text style={styles.buildingLabel}>Kitchen</Text>
                  </View>
                )}
                {property.parking > 0 && (
                  <View style={styles.buildingChip}>
                    <Ionicons name="car-outline" size={18} color={C.primary} />
                    <Text style={styles.buildingCount}>{property.parking}</Text>
                    <Text style={styles.buildingLabel}>Parking</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Owner Card */}
          <View style={styles.card}>
            <View style={styles.ownerRow}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerInitials}>
                  {property.owner_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{property.owner_name}</Text>
                <Text style={styles.ownerSub}>Contact via buttons below</Text>
              </View>
            </View>
          </View>

          {/* Video Tour */}
          {property.video_url && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Video Tour</Text>
              <TouchableOpacity style={styles.videoBox} onPress={() => {
                if (videoRef.current) {
                  videoRef.current.presentFullscreenPlayer();
                  videoRef.current.playAsync();
                }
              }}>
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={24} color="#fff" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.videoText}>Play Video Tour</Text>
              </TouchableOpacity>

              <Video
                ref={videoRef}
                style={{ width: 0, height: 0, opacity: 0 }}
                source={{ uri: `http://10.233.19.214:5000${property.video_url}` }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                onFullscreenUpdate={(e) => {
                  if (e.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
                    videoRef.current?.pauseAsync();
                  }
                }}
              />
            </View>
          )}

          {/* Agent Card */}
          {property.agent_name && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Listed By</Text>
              <View style={styles.agentRow}>
                <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.agentAvatar}>
                  <Text style={styles.agentInitials}>AK</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.agentName}>{property.agent_name}</Text>
                  <Text style={styles.agentRole}>Real Estate Agent</Text>
                </View>
              </View>
            </View>
          )}

          {/* Notes / Description */}
          {property.notes && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.notesText}>{property.notes}</Text>
            </View>
          )}

          {/* Location Interactive Map */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Location: {property.city ?? '—'}</Text>
            <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12, fontFamily: 'Inter-Regular' }}>{property.address ?? 'Address not provided'}</Text>
            {(property.latitude && property.longitude) ? (
              <View style={{ borderRadius: 12, overflow: 'hidden', height: 220, borderWidth: 1, borderColor: C.border }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: property.latitude, longitude: property.longitude }}
                    title={property.owner_name ?? ''}
                    description={property.address ?? ''}
                  />
                </MapView>
              </View>
            ) : (
              <View style={[styles.mapPlaceholder]}>
                <Ionicons name="location-outline" size={28} color={C.textMuted} />
                <Text style={styles.mapCity}>{property.city ?? '—'}</Text>
                <Text style={styles.mapAddress}>Exact location not pinned</Text>
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Call Owner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareIconBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color={C.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // Hero
  hero: { height: 220, position: 'relative' },
  heroPlaceholder: {
    width: '100%', height: 220,
    backgroundColor: '#F0F4F8',
    alignItems: 'center', justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
  },

  // Floating buttons
  floatingBtns: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 54, zIndex: 100,
  },
  floatingRight: { flexDirection: 'row', gap: 8 },
  floatBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },

  // Content wrapper
  content: { paddingHorizontal: 20, paddingTop: 12 },

  // Badges
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  purposeBadge: {
    backgroundColor: C.primaryLight, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  purposeText: { fontSize: 11, fontFamily: 'Inter-Bold', color: C.primary, letterSpacing: 0.8 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },

  // Title + Address
  title: { fontSize: 20, fontFamily: 'Inter-ExtraBold', color: C.text, lineHeight: 26, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  address: { fontSize: 13, fontFamily: 'Inter-Regular', color: C.textMuted, flex: 1 },

  // Price Card
  priceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 14, ...CARD_SHADOW,
  },
  priceRow: { flexDirection: 'row', gap: 0 },
  priceLabel: { fontSize: 11, fontFamily: 'Inter-Regular', color: C.textMuted, marginBottom: 4 },
  priceAmount: { fontSize: 22, fontFamily: 'Inter-ExtraBold', color: C.primary },

  // Specs
  specsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  specCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 10, alignItems: 'center', gap: 4, ...CARD_SHADOW,
  },
  specIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  specValue: { fontSize: 10, fontFamily: 'Inter-Bold', color: C.text, textAlign: 'center' },
  specLabel: { fontSize: 9, fontFamily: 'Inter-Regular', color: C.textMuted, textAlign: 'center' },

  // Generic card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 14, ...CARD_SHADOW,
  },
  sectionTitle: {
    fontSize: 13, fontFamily: 'Inter-Bold', color: C.text,
    marginBottom: 12,
  },

  // Building Info
  buildingRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  buildingChip: {
    backgroundColor: C.background, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, alignItems: 'center', gap: 4,
  },
  buildingCount: { fontSize: 16, fontFamily: 'Inter-Bold', color: C.text },
  buildingLabel: { fontSize: 10, fontFamily: 'Inter-Regular', color: C.textMuted },

  // Owner
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  ownerInitials: { fontSize: 16, fontFamily: 'Inter-Bold', color: C.primary },
  ownerName: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: C.text },
  ownerSub: { fontSize: 12, fontFamily: 'Inter-Regular', color: C.textMuted, marginTop: 2 },

  // Video Tour
  videoBox: {
    backgroundColor: C.background, borderRadius: 12, height: 130,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  playBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  videoText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: C.textSecondary },

  // Agent
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  agentInitials: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#fff' },
  agentName: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: C.text },
  agentRole: { fontSize: 11, fontFamily: 'Inter-Regular', color: C.textMuted, marginTop: 2 },

  // Notes
  notesText: { fontSize: 14, fontFamily: 'Inter-Regular', color: C.textSecondary, lineHeight: 22 },

  // Map
  mapPlaceholder: {
    backgroundColor: C.background, borderRadius: 12, height: 130,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  mapCity: { fontSize: 15, fontFamily: 'Inter-Bold', color: C.text },
  mapAddress: { fontSize: 12, fontFamily: 'Inter-Regular', color: C.textMuted },

  // Action Bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 }, elevation: 8,
  },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, backgroundColor: C.success, borderRadius: 14,
  },
  whatsappBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, backgroundColor: '#25D366', borderRadius: 14,
  },
  shareIconBtn: {
    width: 50, height: 50, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primaryLight, borderRadius: 14,
    borderWidth: 1, borderColor: C.primary,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter-Bold' },
});
