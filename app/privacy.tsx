import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const C = Colors.light;

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>
          Your privacy is important to us. It is Real Estate Manager Pro's policy to respect your privacy regarding any information we may collect from you across our application.
          {'\n\n'}
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
          {'\n\n'}
          We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
          {'\n\n'}
          We don’t share any personally identifying information publicly or with third-parties, except when required to by law.
          {'\n\n'}
          Last Updated: {new Date().toLocaleDateString()}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.spacing.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, fontFamily: 'Inter-Bold' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceElevated, borderRadius: 12 },
  content: { padding: Layout.spacing.lg },
  body: { fontSize: 15, color: C.textSecondary, fontFamily: 'Inter-Regular', lineHeight: 24 },
});
