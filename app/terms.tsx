import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

const C = Colors.light;

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>
          Welcome to Real Estate Manager Pro. These Terms of Service outline the rules and regulations for the use of our application.
          {'\n\n'}
          By accessing this app, we assume you accept these terms and conditions. Do not continue to use Real Estate Manager Pro if you do not agree to take all of the terms and conditions stated on this page.
          {'\n\n'}
          The following terminology applies to these Terms and Conditions: "Client", "You" and "Your" refers to you, the person log on this application. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company.
          {'\n\n'}
          • License: Unless otherwise stated, we own the intellectual property rights for all material on the app.
          {'\n'}
          • User Data: You are responsible for maintaining the confidentiality of your account.
          {'\n'}
          • Prohibited Use: You may not use this app for any unlawful purpose.
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
