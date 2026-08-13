import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Dynamically require compressor to prevent Expo Go native crash
let ImageCompressor: any = { compress: async (uri: string) => uri };
let VideoCompressor: any = { compress: async (uri: string, opts?: any) => uri };
try {
  const Compressor = require('react-native-compressor');
  ImageCompressor = Compressor.Image;
  VideoCompressor = Compressor.Video;
} catch (e) {
  console.log('react-native-compressor native module missing, using fallback (expected in Expo Go)');
}
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAuthStore } from '../../store/authStore';
import { saveSubmissionLocally, syncWithBridge } from '../../store/syncService';

const C = Colors.light;

// ─── Option lists ──────────────────────────────────────────────────────────────
const PROPERTY_CATEGORIES = ['Residential', 'Commercial', 'Agricultural', 'Industrial'];
const PROPERTY_SUBTYPES = ['Plot', 'House', 'Apartment', 'Commercial Plot', 'Shop', 'Building', 'Other'];
const STATUSES       = ['Available', 'Reserved', 'Sold'];
const CURRENCIES     = ['PKR', 'USD'];
const FURNISHED_OPTS = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const AGENT_OPTS     = ['Select Agent', 'Ali Hassan', 'Sara Khan', 'Bilal Ahmad', 'Nadia Iqbal'];

// ─── Small helpers ──────────────────────────────────────────────────────────────
function cycleNext<T>(arr: T[], current: T): T {
  const idx = arr.indexOf(current);
  return arr[(idx + 1) % arr.length];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Plain text field with label */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default' as any,
  multiline = false,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  style?: object;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 4 }, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          s.input,
          multiline && { height: 70, textAlignVertical: 'top', paddingTop: 12 },
          focused && s.inputFocused,
        ]}
        placeholder={placeholder ?? label}
        placeholderTextColor={C.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

/** Modal-based Dropdown */
function Dropdown({
  label,
  options,
  value,
  onChange,
  style,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  style?: object;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[{ gap: 4 }, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={s.dropdown}
        activeOpacity={0.75}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[s.dropdownText, value === options[0] && options[0] === 'Select Agent' && { color: C.textMuted }]}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.textMuted} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={s.dropdownModalContent}>
            <Text style={s.dropdownModalTitle}>Select {label}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.dropdownOptionBtn}
                  onPress={() => { onChange(opt); setModalVisible(false); }}
                >
                  <Text style={[s.dropdownOptionText, value === opt && { color: C.primary, fontWeight: '600' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/** Section card wrapper */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function AddScreen() {
  // Purpose
  const [purpose, setPurpose] = useState<'sale' | 'rent'>('sale');

  // Owner
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile]       = useState('');
  const [agentRef, setAgentRef]   = useState('Select Agent');
  const [description, setDescription] = useState('');

  // Property Details
  const [propertyCategory, setPropertyCategory] = useState('Residential');
  const [propertySubtype, setPropertySubtype] = useState('Plot');
  const [installmentsAvailable, setInstallmentsAvailable] = useState(false);
  const [status, setStatus]             = useState('Available');
  const [areaMarla, setAreaMarla]       = useState('');
  const [areaSqft, setAreaSqft]         = useState('');
  const [length, setLength]             = useState('');
  const [width, setWidth]               = useState('');
  const [address, setAddress]           = useState('');
  const [city, setCity]                 = useState('');

  // Building
  const [beds, setBeds]       = useState('');
  const [baths, setBaths]     = useState('');
  const [kitchens, setKitchens] = useState('');
  const [floors, setFloors]   = useState('');
  const [parking, setParking] = useState('');
  const [furnished, setFurnished] = useState('Unfurnished');

  // Pricing
  const [currency, setCurrency]         = useState('PKR');
  const [price, setPrice]               = useState('');
  const [rentMonthly, setRentMonthly]   = useState('');
  const [rentDeposit, setRentDeposit]   = useState('');
  const [pinCoords, setPinCoords]       = useState({ latitude: 31.5204, longitude: 74.3587 });

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const isPlot = propertySubtype.toLowerCase().includes('plot');
  const showBuilding = !isPlot;

  async function handleGeocode() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'User-Agent': 'RealEstateAppMobile/1.0',
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setPinCoords({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
      } else {
        Alert.alert('Not Found', 'Could not find that location.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch coordinates.');
    }
    setSearching(false);
  }

  function handleMarlaChange(val: string) {
    setAreaMarla(val);
    const num = parseFloat(val);
    setAreaSqft(isNaN(num) ? '' : (num * 272.25).toFixed(0));
  }

  const [images, setImages] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  async function handleMediaUpload() {
    if (images.length >= 10) {
      Alert.alert('Limit Reached', 'You can only upload up to 10 media items.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 1, // Let compressor handle it
    });

    if (!result.canceled) {
      setCompressing(true);
      const newUris: string[] = [];

      try {
        for (const asset of result.assets) {
          // Verify raw video limits (under 600MB and ~2 mins)
          if (asset.type === 'video') {
            if (asset.duration && asset.duration > 130000) { // 2 mins + 10s grace
              Alert.alert('Video too long', 'Please select a video under 2 minutes.');
              continue;
            }
            if (asset.fileSize && asset.fileSize > 600 * 1024 * 1024) {
              Alert.alert('Video too large', 'Please select a video under 600MB.');
              continue;
            }

            const compressedUri = await VideoCompressor.compress(asset.uri, {
              compressionMethod: 'auto',
              maxSize: 480, // Compress to 480p width
            });
            newUris.push(compressedUri);
          } else {
            // Compress Image (light compression to ~2MB max)
            const compressedUri = await ImageCompressor.compress(asset.uri, {
              compressionMethod: 'auto',
              maxWidth: 1920,
              quality: 0.8,
            });
            newUris.push(compressedUri);
          }
        }
        setImages(prev => [...prev, ...newUris]);
      } catch (e) {
        Alert.alert('Compression Error', 'Failed to compress media.');
      } finally {
        setCompressing(false);
      }
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  const [saving, setSaving] = useState(false);

  function resetForm() {
    setPurpose('sale');
    setOwnerName('');
    setMobile('');
    setAgentRef('Select Agent');
    setPropertyCategory('Residential');
    setPropertySubtype('Plot');
    setInstallmentsAvailable(false);
    setStatus('Available');
    setAreaMarla('');
    setAreaSqft('');
    setLength('');
    setWidth('');
    setAddress('');
    setCity('');
    setBeds('');
    setBaths('');
    setKitchens('');
    setFloors('');
    setParking('');
    setFurnished('Unfurnished');
    setCurrency('PKR');
    setPrice('');
    setRentMonthly('');
    setRentDeposit('');
    setImages([]);
    setSearchQuery('');
    setDescription('');
    setPinCoords({ latitude: 31.5204, longitude: 74.3587 });
  }

  async function handleSave() {
    if (!ownerName.trim()) {
      Alert.alert('Required', 'Owner name is required.');
      return;
    }

    setSaving(true);
    try {
      // 1. Save immediately to the phone's local SQLite — works 100% offline
      await saveSubmissionLocally({
        owner_name: ownerName.trim(),
        mobile_number: mobile.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        area_marla: areaMarla ? parseFloat(areaMarla) : undefined,
        area_sqft: areaSqft ? parseFloat(areaSqft) : undefined,
        plot_length: length ? parseFloat(length) : undefined,
        plot_width: width ? parseFloat(width) : undefined,
        property_type: propertyCategory,
        property_subtype: propertySubtype,
        purpose: purpose,
        status: status,
        beds: parseInt(beds) || 0,
        baths: parseInt(baths) || 0,
        kitchens: parseInt(kitchens) || 0,
        parking: parseInt(parking) || 0,
        furnished: furnished,
        rent_monthly: rentMonthly ? parseFloat(rentMonthly) : undefined,
        security_deposit: rentDeposit ? parseFloat(rentDeposit) : undefined,
        installments_available: installmentsAvailable ? 1 : 0,
        demand: price ? parseFloat(price) : undefined,
        demand_currency: currency,
        agent_name: agentRef !== 'Select Agent' ? agentRef : undefined,
        notes: description.trim() || undefined,
        images: images,
      });

      // 2. Try to push to the Cloud Bridge immediately in the background
      syncWithBridge().catch(() => {});

      setSaving(false);
      resetForm();
      Alert.alert(
        '✅ Listing Saved',
        'Your listing has been saved to your device. It will be sent to the Desktop for approval when internet is available.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)') }]
      );
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e?.message ?? 'Failed to save the listing. Please try again.');
    }
  }

  const user = useAuthStore(s => s.user);
  if (user?.role === 'agent' && user.permission !== 'full') {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="lock-closed" size={64} color={C.textMuted} />
        <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: C.text, marginTop: 16, textAlign: 'center' }}>
          Access Denied
        </Text>
        <Text style={{ fontSize: 14, color: C.textSecondary, fontFamily: 'Inter-Regular', marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
          You do not have permission to add new properties. Please contact your administrator.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Top safe area + header */}
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => router.push('/(tabs)')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Add Property</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Scrollable form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Purpose Toggle ─────────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Listing Purpose</Text>
            <View style={s.purposeRow}>
              <TouchableOpacity
                style={[s.purposeBtn, purpose === 'sale' && s.purposeBtnActive]}
                onPress={() => setPurpose('sale')}
                activeOpacity={0.8}
              >
                <Text style={[s.purposeBtnText, purpose === 'sale' && s.purposeBtnTextActive]}>
                  For Sale
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.purposeBtn, purpose === 'rent' && s.purposeBtnActive]}
                onPress={() => setPurpose('rent')}
                activeOpacity={0.8}
              >
                <Text style={[s.purposeBtnText, purpose === 'rent' && s.purposeBtnTextActive]}>
                  For Rent
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.sectionTitle, { marginTop: 16 }]}>Description (Optional)</Text>
            <TextInput
              style={[s.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="e.g. Prime location, facing park..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* ── Owner Information ──────────────────────────────────────────── */}
          <SectionCard title="Owner Information">
            <Field label="Owner Name" value={ownerName} onChangeText={setOwnerName} />
            <Field label="Mobile Number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
            <Dropdown
              label="Reference / Agent"
              options={AGENT_OPTS}
              value={agentRef}
              onChange={setAgentRef}
            />
          </SectionCard>

          {/* ── Property Details ───────────────────────────────────────────── */}
          <SectionCard title="Property Details">
            <Dropdown label="Property Category" options={PROPERTY_CATEGORIES} value={propertyCategory} onChange={setPropertyCategory} />
            <Dropdown label="Property Subtype" options={PROPERTY_SUBTYPES} value={propertySubtype} onChange={setPropertySubtype} />
            <Dropdown label="Status" options={STATUSES} value={status} onChange={setStatus} />
            
            {purpose === 'sale' && isPlot && (
              <View style={[s.row, { alignItems: 'center', marginTop: 12, marginBottom: 8 }]}>
                <Text style={[s.fieldLabel, { flex: 1, marginBottom: 0 }]}>Installments Available?</Text>
                <TouchableOpacity
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    backgroundColor: installmentsAvailable ? C.primary : C.border,
                    justifyContent: 'center', alignItems: installmentsAvailable ? 'flex-end' : 'flex-start',
                    padding: 2,
                  }}
                  onPress={() => setInstallmentsAvailable(!installmentsAvailable)}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
                </TouchableOpacity>
              </View>
            )}

            {/* Area row */}
            <View style={s.row}>
              <Field
                label="Area in Marla"
                value={areaMarla}
                onChangeText={handleMarlaChange}
                keyboardType="decimal-pad"
                style={{ flex: 1 }}
              />
              <Field
                label="Area in Sqft"
                value={areaSqft}
                onChangeText={setAreaSqft}
                keyboardType="decimal-pad"
                style={{ flex: 1 }}
              />
            </View>

            {/* Dimensions row */}
            <View style={s.row}>
              <Field label="Plot Length ft" value={length} onChangeText={setLength} keyboardType="decimal-pad" style={{ flex: 1 }} />
              <Field label="Plot Width ft"  value={width}  onChangeText={setWidth}  keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>

            <Field label="Address" value={address} onChangeText={setAddress} multiline />
            <Field label="City"    value={city}    onChangeText={setCity} />
          </SectionCard>

          {/* ── Building Information (conditional) ────────────────────────── */}
          {showBuilding && (
            <SectionCard title="Building Information">
              <View style={s.row}>
                <Field label="Bedrooms"  value={beds}     onChangeText={setBeds}     keyboardType="number-pad" style={{ flex: 1 }} />
                <Field label="Bathrooms" value={baths}    onChangeText={setBaths}    keyboardType="number-pad" style={{ flex: 1 }} />
              </View>
              <View style={s.row}>
                <Field label="Kitchens" value={kitchens} onChangeText={setKitchens} keyboardType="number-pad" style={{ flex: 1 }} />
                <Field label="Floors"   value={floors}   onChangeText={setFloors}   keyboardType="number-pad" style={{ flex: 1 }} />
              </View>
              <Field label="Parking Spaces" value={parking} onChangeText={setParking} keyboardType="number-pad" />
              <Dropdown label="Furnished" options={FURNISHED_OPTS} value={furnished} onChange={setFurnished} />
            </SectionCard>
          )}

          {/* ── Pricing ───────────────────────────────────────────────────── */}
          <SectionCard title="Pricing">
            {purpose === 'sale' ? (
              <>
                <View style={s.row}>
                  <Dropdown label="Currency" options={CURRENCIES} value={currency} onChange={setCurrency} style={{ flex: 1 }} />
                  <Field label="Demand Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={{ flex: 2 }} />
                </View>
              </>
            ) : (
              <>
                <Field label="Monthly Rent"    value={rentMonthly} onChangeText={setRentMonthly} keyboardType="decimal-pad" />
                <Field label="Security Deposit" value={rentDeposit} onChangeText={setRentDeposit} keyboardType="decimal-pad" />
              </>
            )}
          </SectionCard>

          {/* ── Location Map ──────────────────────────────────────────────── */}
          <SectionCard title="Location Map">
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <TextInput
                style={[s.input, { flex: 1, height: 44 }]}
                placeholder="Search City or Address"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleGeocode}
                placeholderTextColor={C.textMuted}
              />
              <TouchableOpacity style={s.searchBtn} onPress={handleGeocode} disabled={searching}>
                <Text style={{ color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 13 }}>
                  {searching ? '...' : 'Search'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
              <MapView
                style={{ flex: 1 }}
                region={{
                  latitude: pinCoords.latitude,
                  longitude: pinCoords.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                onPress={(e) => setPinCoords(e.nativeEvent.coordinate)}
              >
                <Marker
                  coordinate={pinCoords}
                  draggable
                  onDragEnd={(e) => setPinCoords(e.nativeEvent.coordinate)}
                />
              </MapView>
            </View>
          </SectionCard>

          {/* ── Media ─────────────────────────────────────────────────────── */}
          <SectionCard title="Media">
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {images.map((uri, index) => (
                  <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                    <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                    <TouchableOpacity
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24,
                        alignItems: 'center', justifyContent: 'center'
                      }}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={s.mediaBox} activeOpacity={0.8} onPress={handleMediaUpload} disabled={compressing}>
              {compressing ? (
                <>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={[s.mediaText, { marginTop: 8 }]}>Compressing media... please wait</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={28} color={C.textMuted} />
                  <Text style={s.mediaText}>Tap to upload photos / video (Max 10)</Text>
                </>
              )}
            </TouchableOpacity>
          </SectionCard>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Save Button ─────────────────────────────────────────────── */}
      <View style={s.stickyBar}>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={s.saveBtnText}>Save Property</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.background },

  /* Header */
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
  headerTitle: { fontSize: 17, fontFamily: 'Inter-Bold', color: C.text },
  closeBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
  },

  /* Scroll */
  scrollContent: { padding: Layout.spacing.lg, paddingBottom: 100, gap: 16 },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Inter-Bold', color: C.text },

  /* Purpose toggle */
  purposeRow:          { flexDirection: 'row', gap: 10 },
  purposeBtn: {
    flex: 1, height: 46,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: '#FFFFFF',
  },
  purposeBtnActive:    { backgroundColor: C.primary, borderColor: C.primary },
  purposeBtnText:      { fontSize: 15, fontFamily: 'Inter-SemiBold', color: C.text },
  purposeBtnTextActive:{ color: '#FFFFFF' },

  /* Fields */
  fieldLabel: { fontSize: 13, color: C.textSecondary, fontFamily: 'Inter-Medium', marginBottom: 0 },
  input: {
    borderWidth: 1, borderColor: C.border,
    borderRadius: 10, backgroundColor: '#FFFFFF',
    height: 48, paddingHorizontal: 14,
    fontSize: 14, color: C.text,
    fontFamily: 'Inter-Regular',
  },
  inputFocused: { borderColor: C.primary },

  /* Dropdown */
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 10, backgroundColor: '#FFFFFF',
    height: 48, paddingHorizontal: 14,
  },
  dropdownText: { fontSize: 14, color: C.text, fontFamily: 'Inter-Regular', flex: 1 },

  /* Row layout (side-by-side) */
  row: { flexDirection: 'row', gap: 10 },

  /* Map placeholder */
  mapBox: {
    height: 130,
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  mapText: { fontSize: 13, color: C.textMuted, fontFamily: 'Inter-Regular' },

  /* Media upload box */
  mediaBox: {
    height: 100,
    borderStyle: 'dashed',
    borderColor: C.border,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  mediaText: { fontSize: 13, color: C.textMuted, fontFamily: 'Inter-Regular' },

  /* Sticky bottom bar */
  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 10,
    backgroundColor: C.background,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtn: {
    backgroundColor: C.primary,
    height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  searchBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  dropdownModalContent: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400,
  },
  dropdownModalTitle: {
    fontSize: 18, fontFamily: 'Inter-Bold', color: C.text, marginBottom: 16, textAlign: 'center',
  },
  dropdownOptionBtn: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: C.text,
    textAlign: 'center',
  },
});
