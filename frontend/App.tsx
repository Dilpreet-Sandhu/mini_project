import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Avatar, Icon } from './src/components/ui';
import { colors } from './src/lib/theme';
import { useAuth } from './src/stores/auth';
import { usePortal } from './src/stores/portal';
import { AuthScreen } from './src/screens/AuthScreen';
import { ComplaintsScreen } from './src/screens/ComplaintsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { NewComplaintScreen } from './src/screens/NewComplaintScreen';
import { DetailScreen } from './src/screens/DetailScreen';

function Portal() {
  const user = useAuth((st) => st.user)!;
  const [tab, setTab] = useState('home');
  const [modal, setModal] = useState<{ type: 'new' } | { type: 'detail'; id: string } | null>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    void usePortal.getState().refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' || Platform.OS === 'web')
        void usePortal.getState().refresh();
    }, 20000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void usePortal.getState().refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modal) {
        setModal(null);
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [modal, tab]);
  const open = (id: string) => setModal({ type: 'detail', id });
  const admin = user.role === 'admin';
  const student = user.role === 'student';
  const tabs = [
    {
      key: 'home',
      label: admin ? 'Overview' : student ? 'Home' : 'Queue',
      icon: admin ? 'grid-outline' : 'chatbubbles-outline',
      active: admin ? 'grid' : 'chatbubbles',
    },
    { key: 'history', label: admin ? 'Requests' : 'History', icon: 'time-outline', active: 'time' },
    { key: 'people', label: 'People', icon: 'people-outline', active: 'people' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', active: 'person' },
  ];
  return (
    <View style={a.portal}>
      <View style={a.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={a.logo}>
            <Icon name="chatbubble-ellipses" color="#fff" size={19} />
          </View>
          <Text style={a.wordmark}>
            roomline<Text style={{ color: colors.teal }}>.</Text>
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={a.rolePill}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.teal }} />
            <Text
              style={{
                fontSize: 9,
                color: colors.teal,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.7,
              }}
            >
              {admin ? 'Admin' : user.role}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => setTab('profile')}
          >
            <Avatar name={user.name} size={35} ring />
          </Pressable>
        </View>
      </View>
      <View style={{ flex: 1}}>
        {tab === 'home' ? (
          admin ? (
            <DashboardScreen />
          ) : (
            <ComplaintsScreen key="active" open={open} create={() => setModal({ type: 'new' })} />
          )
        ) : tab === 'history' ? (
          <ComplaintsScreen
            key="history"
            history
            open={open}
            create={() => setModal({ type: 'new' })}
          />
        ) : tab === 'people' ? (
          <PeopleScreen />
        ) : (
          <ProfileScreen />
        )}
        {student && tab === 'home' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a complaint"
            onPress={() => setModal({ type: 'new' })}
            style={a.fab}
          >
            <Icon name="add" size={30} color="#fff" />
          </Pressable>
        )}
      </View>
      <View style={{...a.tabs}}>
        {tabs.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.key === tab }}
            onPress={() => setTab(item.key)}
            style={[{...a.tab}]}
          >
            <View style={[a.tabIcon, item.key === tab && { backgroundColor: colors.mint,borderRadius : 20}]}>
              <Icon
                name={item.key === tab ? item.active : item.icon}
                color={item.key === tab ? colors.teal : colors.muted}
                size={22}
              />
            </View>
            <Text
              style={{
                fontSize: 10,
                color: item.key === tab ? colors.teal : colors.muted,
                fontWeight: item.key === tab ? '700' : '500',
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Modal
        visible={!!modal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModal(null)}
      >
        <View
          style={[
            a.modalBackdrop,
            {
              paddingTop: Platform.OS === 'web' ? 0 : insets.top,
              paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
            },
          ]}
        >
          <View style={a.modalContent}>
            {modal?.type === 'new' ? (
              <NewComplaintScreen close={() => setModal(null)} created={open} />
            ) : modal?.type === 'detail' ? (
              <DetailScreen key={modal.id} id={modal.id} close={() => setModal(null)} />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
function Root() {
  const { user, booting, bootstrap } = useAuth();
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  return (
    <SafeAreaView style={a.safe}>
      <StatusBar style="dark" />
      <View style={a.frame}>
        {booting ? (
          <View style={a.loader}>
            <ActivityIndicator color={colors.teal} />
            <Text style={{ color: colors.teal, fontSize: 15, fontWeight: '600' }}>
              Making room for you...
            </Text>
          </View>
        ) : user ? (
          <Portal key={user.id} />
        ) : (
          <AuthScreen />
        )}
      </View>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
const a = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E6ECE5', alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: 520, backgroundColor: colors.bg },
  portal: { flex: 1 },
  header: {
    height: 79,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: { color: colors.ink, fontSize: 25, fontWeight: '700', letterSpacing: -1.2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8E6DB',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: 10,
    paddingBottom: 12,
  },
  tab: {flex : 1,alignItems: 'center', gap: 4 },
  tabIcon: {
    width: 51,
    height: 31,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    backgroundColor: colors.teal,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    boxShadow: '0px 6px 20px #147D6933',
  },
  loader: { flex: 1, gap: 18, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: '#E6ECE5', alignItems: 'center' },
  modalContent: { flex: 1, width: '100%', maxWidth: 520 },
});
