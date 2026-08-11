import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { syncWithBridge } from '../../store/syncService';

const C = Colors.light;

function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? C.primary : C.textMuted}
    />
  );
}

function AddTabIcon() {
  return (
    <View style={styles.fab}>
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </View>
  );
}

const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default function TabLayout() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Sync immediately on app open
    syncWithBridge().catch(() => {});
    // Then sync every 10 minutes
    syncTimer.current = setInterval(() => {
      syncWithBridge().catch(() => {});
    }, SYNC_INTERVAL_MS);
    return () => {
      if (syncTimer.current) clearInterval(syncTimer.current);
    };
  }, []);


  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard', 'Dashboard'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
        }}
      />

      {/* 2. Properties */}
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.properties', 'Properties'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />

      {/* 3. Add — FAB (no label) */}
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => <AddTabIcon />,
        }}
      />

      {/* 4. Billing */}
      <Tabs.Screen
        name="billing"
        options={{
          title: t('tabs.billing', 'Billing'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'card' : 'card-outline'} focused={focused} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile', 'Profile'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 62,
    paddingBottom: 8,
    paddingTop: 4,
    elevation: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    // Shadow for iOS
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 8,
  },
});
