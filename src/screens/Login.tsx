import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, session, DEFAULT_SERVER } from '../api';
import { c } from '../theme';
import { useDriver } from '../../App';

export default function Login() {
  const { setDriver } = useDriver(); const ins = useSafeAreaInsets();
  const [phone, setPhone] = useState(''); const [pw, setPw] = useState(''); const [server, setServer] = useState(session.server || DEFAULT_SERVER); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [adv, setAdv] = useState(false);
  const go = async () => {
    setBusy(true); setErr('');
    try { session.server = server.trim().replace(/\/+$/, ''); const r = await api('/auth/login', { phone, password: pw }); await session.save(server.trim(), r.token); setDriver(r.driver); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.navy }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: ins.top + 40 }} keyboardShouldPersistTaps="handled">
        <View style={s.logo}><Text style={{ fontSize: 26 }}>🚚</Text></View>
        <Text style={s.title}>HomeNeed <Text style={{ color: c.orange }}>Driver</Text></Text>
        <Text style={s.sub}>Sign in to see your deliveries.</Text>
        <View style={s.card}>
          <Text style={s.label}>Mobile number</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98765 00001" placeholderTextColor={c.faint} autoComplete="tel" />
          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={pw} onChangeText={setPw} secureTextEntry placeholder="••••••" placeholderTextColor={c.faint} onSubmitEditing={go} />
          {adv && <><Text style={s.label}>Server address</Text><TextInput style={s.input} value={server} onChangeText={setServer} autoCapitalize="none" autoCorrect={false} placeholder="http://192.168.1.5:4000" placeholderTextColor={c.faint} /></>}
          {!!err && <Text style={s.err}>{err}</Text>}
          <Pressable style={[s.btn, (busy || !phone || !pw) && { opacity: 0.55 }]} disabled={busy || !phone || !pw} onPress={go}><Text style={s.btnT}>{busy ? 'Signing in…' : 'Sign in'}</Text></Pressable>
          <Pressable onPress={() => setAdv(!adv)}><Text style={s.link}>{adv ? 'Hide' : 'Change'} server address</Text></Pressable>
        </View>
        <Text style={s.hint}>Demo driver: 9876500001 · Driver@123</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: c.orange, alignItems: 'center', justifyContent: 'center' }, title: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 18 }, sub: { color: '#B9C6E4', marginTop: 6, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginTop: 28, gap: 6 }, label: { fontWeight: '700', color: c.text, marginTop: 8, fontSize: 13 },
  input: { height: 50, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, color: c.text }, err: { color: c.red, marginTop: 8, fontWeight: '600' },
  btn: { height: 52, borderRadius: 14, backgroundColor: c.orange, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, btnT: { color: '#fff', fontWeight: '800', fontSize: 16 }, link: { textAlign: 'center', color: c.muted, marginTop: 14, fontWeight: '600' }, hint: { color: '#7F8DB0', textAlign: 'center', marginTop: 22 },
});
