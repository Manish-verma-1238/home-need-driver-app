import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api, session } from './src/api';
import { c } from './src/theme';
import Login from './src/screens/Login';
import Tasks from './src/screens/Tasks';
import Delivery from './src/screens/Delivery';

type Ctx = { driver: any; setDriver: (d: any) => void; signOut: () => Promise<void> };
const A = createContext<Ctx>(null as any);
export const useDriver = () => useContext(A);
const Stack = createNativeStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false); const [driver, setDriver] = useState<any>(null);
  useEffect(() => { (async () => { await session.load(); if (session.token) { try { setDriver((await api('/me')).driver); } catch { await session.clear(); } } setReady(true); })(); }, []);
  const signOut = async () => { await session.clear(); setDriver(null); };
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#fff" /></View>;
  return (
    <SafeAreaProvider>
      <A.Provider value={{ driver, setDriver, signOut }}>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
            {!driver ? <Stack.Screen name="Login" component={Login} /> : <><Stack.Screen name="Tasks" component={Tasks} /><Stack.Screen name="Delivery" component={Delivery} /></>}
          </Stack.Navigator>
        </NavigationContainer>
      </A.Provider>
    </SafeAreaProvider>
  );
}
