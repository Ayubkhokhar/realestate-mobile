import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import MapView, { Marker, Callout } from 'react-native-maps';
import { usePropertyStore, Property, PropertyFilters } from '../../store/propertyStore';

const C = Colors.light;

// ─── Filter config ─────────────────────────────────────────────────────────────
const PURPOSE_CHIPS = ['All', 'For Sale', 'For Rent'] as const;
const STATUS_CHIPS  = ['All', 'Available', 'Reserved', 'Sold'] as const;
const ADV_TYPES = ['All', 'House', 'Apartment', 'Commercial', 'Plot'];
const SORT_OPTIONS = ['Newest First', 'Price: Low to High', 'Price: High to Low'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  Available: C.success,
  Reserved:  C.warning,
  Sold:      C.danger,
};

const statusBg: Record<string, string> = {
  Available: C.successLight,
  Reserved:  C.warningLight,
  Sold:      C.dangerLight,
};

function formatDemand(p: Property): string {
  // For rental properties, prefer rent_monthly over demand
  const amount = (p.purpose === 'rent' && p.rent_monthly) ? p.rent_monthly : p.demand;
  if (!amount && amount !== 0) return 'N/A';
  const val = Number(amount);
  if (isNaN(val) || val === 0) return 'N/A';
  if (val >= 10000000) return `PKR ${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000)   return `PKR ${(val / 100000).toFixed(0)} L`;
  return `PKR ${val.toLocaleString()}`;
}

// ─── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ p }: { p: Property }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={() => router.push(`/property/${p.id}` as any)}
    >
      <View style={styles.cardImg}>
        <Text style={{ fontSize: 30 }}>🏠</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {p.owner_name ?? 'Unknown Owner'}
        </Text>

        <View style={styles.cardCityRow}>
          <Ionicons name="location-outline" size={11} color={C.textMuted} />
          <Text style={styles.cardCity}>{p.city ?? '—'}</Text>
        </View>

        <View style={styles.badgesWrap}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg[p.status] ?? C.warningLight }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor[p.status] ?? C.warning }]}>{p.status}</Text>
          </View>
          {p.property_type ? (
            <View style={styles.purposeBadge}>
              <Text style={[styles.purposeText, { color: C.primary }]}>{p.property_type.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardPrice}>{formatDemand(p)}</Text>
          <Text style={styles.cardArea}>{p.area_marla ? `${p.area_marla} Marla` : p.area_sqft ? `${p.area_sqft} sqft` : '—'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Skeleton Loader ───────────────────────────────────────────────────────────
function PropertySkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.cardImg, { backgroundColor: '#E2E8F0' }]} />
      <View style={styles.cardBody}>
        <View style={{ height: 16, width: '80%', backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
        <View style={{ height: 12, width: '40%', backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
          <View style={{ height: 14, width: 50, backgroundColor: '#E2E8F0', borderRadius: 10 }} />
          <View style={{ height: 14, width: 50, backgroundColor: '#E2E8F0', borderRadius: 10 }} />
        </View>
        <View style={{ height: 14, width: '60%', backgroundColor: '#E2E8F0', borderRadius: 4, marginTop: 'auto' }} />
      </View>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const [query,         setQuery]         = useState('');
  const [focused,       setFocused]       = useState(false);
  const [activePurpose, setActivePurpose] = useState<typeof PURPOSE_CHIPS[number]>('All');
  const [activeStatus,  setActiveStatus]  = useState<typeof STATUS_CHIPS[number]>('All');
  const [viewMode,      setViewMode]      = useState<'list' | 'map'>('list');
  
  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [advType, setAdvType] = useState('All');
  const [advSort, setAdvSort] = useState('Newest First');
  const [advCity, setAdvCity] = useState('');
  const [marlaMin, setMarlaMin] = useState('');
  const [marlaMax, setMarlaMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const { properties, isLoading, loadProperties } = usePropertyStore();

  const applyFilters = useCallback(() => {
    const filters: PropertyFilters = {};
    if (query) filters.query = query;
    if (activeStatus !== 'All') filters.status = activeStatus;
    if (activePurpose !== 'All') filters.purpose = activePurpose;
    if (advCity) filters.city = advCity;
    if (advType !== 'All') filters.property_type = advType;
    if (marlaMin) filters.min_marla = parseFloat(marlaMin);
    if (marlaMax) filters.max_marla = parseFloat(marlaMax);
    if (priceMin) filters.min_price = parseFloat(priceMin);
    if (priceMax) filters.max_price = parseFloat(priceMax);
    if (advSort === 'Price: Low to High') filters.sort = 'price_asc';
    else if (advSort === 'Price: High to Low') filters.sort = 'price_desc';
    else filters.sort = 'newest';
    loadProperties(filters);
  }, [query, activeStatus, activePurpose, advCity, advType, marlaMin, marlaMax, priceMin, priceMax, advSort]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const filtered = properties;

  const handleResetFilters = () => {
    setAdvType('All');
    setAdvSort('Newest First');
    setAdvCity('');
    setMarlaMin('');
    setMarlaMax('');
    setPriceMin('');
    setPriceMax('');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Properties</Text>
        </View>

        {/* Search bar + Advanced Filter Button */}
        <View style={styles.searchWrap}>
          <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
            <Ionicons name="search-outline" size={18} color={focused ? C.primary : C.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by owner, city, address..."
              placeholderTextColor={C.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={17} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.filterBtn, showFilters && { backgroundColor: C.primaryLight, borderColor: C.primary }]} 
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={20} color={showFilters ? C.primary : C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <View style={styles.filtersWrap}>
          {/* Purpose row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {PURPOSE_CHIPS.map(chip => (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, activePurpose === chip && styles.chipActive]}
                onPress={() => setActivePurpose(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, activePurpose === chip && styles.chipTextActive]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Status row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {STATUS_CHIPS.map(chip => (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, activeStatus === chip && styles.chipActive]}
                onPress={() => setActiveStatus(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, activeStatus === chip && styles.chipTextActive]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* View Toggle */}
      <View style={{ paddingHorizontal: Layout.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={styles.resultCount}>{filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'} found</Text>
        <View style={{ flexDirection: 'row', backgroundColor: C.border, borderRadius: 8, padding: 2 }}>
          <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}>
            <Ionicons name="list" size={16} color={viewMode === 'list' ? C.primary : C.textMuted} />
            <Text style={[styles.viewToggleText, viewMode === 'list' && { color: C.primary }]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('map')} style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}>
            <Ionicons name="map-outline" size={16} color={viewMode === 'map' ? C.primary : C.textMuted} />
            <Text style={[styles.viewToggleText, viewMode === 'map' && { color: C.primary }]}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {viewMode === 'list' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {isLoading ? (
            <>
              <PropertySkeleton />
              <PropertySkeleton />
              <PropertySkeleton />
              <PropertySkeleton />
            </>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 44, marginBottom: 10 }}>🔍</Text>
              <Text style={styles.emptyTitle}>No Properties Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filtered.map(p => <PropertyCard key={p.id} p={p} />)
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, marginHorizontal: Layout.spacing.lg, marginBottom: 20, borderRadius: 14, overflow: 'hidden' }}>
          {isLoading ? (
            <View style={{ flex: 1, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.textMuted }}>Loading Map...</Text>
            </View>
          ) : (
            <MapView 
              style={{ flex: 1 }}
              initialRegion={{
                latitude: 31.5204, // default Lahore
                longitude: 74.3587,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {filtered.map(p => {
                if (!p.latitude || !p.longitude) return null;
                return (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                    pinColor={statusColor[p.status] || C.primary}
                  >
                    <Callout onPress={() => router.push(`/property/${p.id}` as any)}>
                      <View style={{ padding: 5, width: 150 }}>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, marginBottom: 2 }} numberOfLines={1}>{p.owner_name}</Text>
                        <Text style={{ fontFamily: 'Inter-Medium', color: C.primary, fontSize: 12 }}>{formatDemand(p)}</Text>
                        <Text style={{ color: C.textMuted, fontSize: 11 }}>Tap to view details</Text>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          )}
        </View>
      )}

      {/* Advanced Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ paddingHorizontal: 20 }}>
              
              {/* Type */}
              <Text style={styles.filterSectionTitle}>Property Type</Text>
              <View style={styles.filterOptionsGrid}>
                {ADV_TYPES.map(type => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.filterOptionBtn, advType === type && styles.filterOptionActiveBtn]}
                    onPress={() => setAdvType(type)}
                  >
                    <Text style={[styles.filterOptionText, advType === type && styles.filterOptionActiveText]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sorting */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterOptionsGrid}>
                {SORT_OPTIONS.map(sort => (
                  <TouchableOpacity 
                    key={sort} 
                    style={[styles.filterOptionBtn, advSort === sort && styles.filterOptionActiveBtn]}
                    onPress={() => setAdvSort(sort)}
                  >
                    <Text style={[styles.filterOptionText, advSort === sort && styles.filterOptionActiveText]}>{sort}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* City */}
              <Text style={styles.filterSectionTitle}>City</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="business-outline" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.filterInput}
                  placeholder="e.g. Lahore..."
                  placeholderTextColor={C.textMuted}
                  value={advCity}
                  onChangeText={setAdvCity}
                />
              </View>

              {/* Marla */}
              <Text style={styles.filterSectionTitle}>Area (Marla)</Text>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder="Min"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                  value={marlaMin}
                  onChangeText={setMarlaMin}
                />
                <Text style={styles.toText}>to</Text>
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder="Max"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                  value={marlaMax}
                  onChangeText={setMarlaMax}
                />
              </View>

              {/* Price */}
              <Text style={styles.filterSectionTitle}>Price (Lac)</Text>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder="Min"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                  value={priceMin}
                  onChangeText={setPriceMin}
                />
                <Text style={styles.toText}>to</Text>
                <TextInput
                  style={[styles.filterInput, styles.halfInput]}
                  placeholder="Max"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                  value={priceMax}
                  onChangeText={setPriceMax}
                />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalClearBtn} onPress={handleResetFilters}>
                <Text style={styles.modalClearText}>Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.modalApplyText}>Show Results</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.background },
  header:          { paddingHorizontal: Layout.spacing.lg, paddingTop: 8, paddingBottom: 4 },
  headerTitle:     { fontSize: 26, fontFamily: 'Inter-ExtraBold', color: C.text },

  searchWrap:      { paddingHorizontal: Layout.spacing.lg, paddingBottom: 10, flexDirection: 'row', gap: 10 },
  searchBar:       {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 48,
  },
  searchBarFocused: { borderColor: C.primary },
  searchInput:     { flex: 1, color: C.text, fontSize: 14, fontFamily: 'Inter-Regular' },
  filterBtn:       { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  filtersWrap:     { gap: 6, paddingBottom: 8 },
  chipsRow:        { paddingHorizontal: Layout.spacing.lg, gap: 8 },
  chip:            {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Layout.radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: C.border,
  },
  chipActive:      { backgroundColor: C.primary, borderColor: C.primary },
  chipText:        { fontSize: 13, color: C.textMuted, fontFamily: 'Inter-Medium' },
  chipTextActive:  { color: '#FFFFFF', fontFamily: 'Inter-SemiBold' },

  listContent:     { padding: Layout.spacing.lg, paddingTop: 0, paddingBottom: 100, gap: 12 },
  resultCount:     { fontSize: 12, color: C.textMuted, fontFamily: 'Inter-Medium', marginBottom: 4 },
  
  viewToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  viewToggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  viewToggleText: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: C.textSecondary },

  card: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardImg: { width: 70, height: 70, backgroundColor: C.surfaceElevated, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBody:        { flex: 1, gap: 2 },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle:       { flex: 1, fontSize: 14, fontFamily: 'Inter-SemiBold', color: C.text },

  badgesWrap:      { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 2 },
  purposeBadge:    { borderRadius: Layout.radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  purposeSale:     { backgroundColor: 'rgba(26,154,245,0.12)' },
  purposeRent:     { backgroundColor: 'rgba(245,158,11,0.12)' },
  purposeText:     { fontSize: 10, fontFamily: 'Inter-Bold' },
  purposeSaleText: { color: C.primary },
  purposeRentText: { color: C.accent },

  cardCityRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardCity:        { fontSize: 12, color: C.textMuted, fontFamily: 'Inter-Regular' },

  cardSpecsRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 4, borderLeftWidth: 1, borderLeftColor: C.border },
  cardSpec:        { fontSize: 12, color: C.textMuted, fontFamily: 'Inter-Regular' },

  cardBottomRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  cardPrice:       { fontSize: 14, fontFamily: 'Inter-Bold', color: C.primary },
  cardArea:        { fontSize: 12, color: C.textMuted, fontFamily: 'Inter-Regular' },

  statusBadge:     { borderRadius: Layout.radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontFamily: 'Inter-SemiBold' },

  emptyState:      { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:      { fontSize: 17, fontFamily: 'Inter-Bold', color: C.text, marginBottom: 6 },
  emptySubtitle:   { fontSize: 13, color: C.textMuted, fontFamily: 'Inter-Regular' },
  
  /* Modal Filters */
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:    { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 30 },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle:      { fontSize: 18, fontFamily: 'Inter-Bold', color: C.text },
  filterSectionTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: C.textSecondary, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  filterOptionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterOptionBtn:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Layout.radius.md, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFFFFF' },
  filterOptionActiveBtn: { backgroundColor: C.primaryLight, borderColor: C.primary },
  filterOptionText:   { fontSize: 14, fontFamily: 'Inter-Medium', color: C.textSecondary },
  filterOptionActiveText: { color: C.primary, fontFamily: 'Inter-Bold' },
  
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, height: 46 },
  rowInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterInput: { flex: 1, color: C.text, fontSize: 14, fontFamily: 'Inter-Regular', height: '100%' },
  halfInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, height: 46 },
  toText: { fontSize: 14, color: C.textMuted, fontFamily: 'Inter-Medium' },

  modalFooter:     { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: C.border, gap: 12 },
  modalClearBtn:   { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  modalClearText:  { fontSize: 16, fontFamily: 'Inter-SemiBold', color: C.textSecondary },
  modalApplyBtn:   { flex: 2, height: 50, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  modalApplyText:  { fontSize: 16, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
});
