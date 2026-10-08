import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { c, statusStyle, tm, inr, minsLeft } from '../theme';
import DeliveryMap from '../DeliveryMap';
import { useLocationSharing } from '../location';

const NEXT: Record<string, { to: string; label: string; hint: string }> = {
  assigned: { to: 'accept', label: 'Accept delivery', hint: 'Confirm you can take this delivery.' },
  accepted: { to: 'pickup', label: "I've loaded & picked up", hint: 'Tap after loading the materials at the hub.' },
  picked_up: { to: 'start', label: 'Start trip', hint: 'Customer will see you on the live map.' },
  out_for_delivery: { to: 'arrive', label: "I've arrived", hint: 'Tap when you reach the site.' },
  arrived: { to: 'deliver', label: 'Complete delivery', hint: 'Ask the customer for their 4-digit OTP.' },
};
const REASONS = ['Customer not reachable', 'Site closed / no one to receive', 'Wrong address', 'Customer refused delivery', 'Vehicle breakdown', 'Road blocked'];
const STEPS: [string, string][] = [['assigned', 'Assigned'], ['picked_up', 'Picked up'], ['out_for_delivery', 'On the way'], ['delivered', 'Delivered']];
const ORDER = ['assigned', 'accepted', 'picked_up', 'out_for_delivery', 'arrived', 'delivered'];

export default function Delivery({ route, navigation }: any) {
  const ins = useSafeAreaInsets(); const id = route.params.id;
  const [d, setD] = useState<any>(null); const [busy, setBusy] = useState(false); const [otpOpen, setOtpOpen] = useState(false); const [otp, setOtp] = useState(''); const [mode, setMode] = useState<'Cash' | 'UPI'>('Cash'); const [note, setNote] = useState(''); const [failOpen, setFailOpen] = useState(false); const [err, setErr] = useState('');
  const load = useCallback(async () => { try { setD(await api(`/deliveries/${id}`)); } catch (e: any) { Alert.alert('Error', e.message); navigation.goBack(); } }, [id]);
  useFocusEffect(useCallback(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]));
  const tripOn = !!d && ['picked_up', 'out_for_delivery', 'arrived'].includes(d.status);
  const { me, denied } = useLocationSharing(tripOn);
  if (!d) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.muted }}>Loading…</Text></View>;
  const st = statusStyle[d.status] || statusStyle.assigned, next = NEXT[d.status], pre = ['assigned', 'accepted'].includes(d.status), closed = ['delivered', 'failed'].includes(d.status), idx = ORDER.indexOf(d.status), ml = minsLeft(d.etaAt);
  const act = async (path: string, body?: any) => { setBusy(true); setErr(''); try { setD(await api(`/deliveries/${id}/${path}`, body ?? {})); return true; } catch (e: any) { setErr(e.message); return false; } finally { setBusy(false); } };
  const press = async () => { if (!next) return; if (next.to === 'deliver') { setOtp(''); setNote(''); setErr(''); setOtpOpen(true); } else await act(next.to); };
  const call = () => Linking.openURL(`tel:${d.drop.phone}`);
  const nav = () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${(pre || d.status === 'picked_up') && d.status !== 'picked_up' ? `${d.pickup.lat},${d.pickup.lng}` : `${d.drop.lat},${d.drop.lng}`}`);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[s.top, { paddingTop: ins.top + 8 }]}><Pressable onPress={() => navigation.goBack()} style={s.back}><Text style={{ fontSize: 20, color: c.text }}>←</Text></Pressable><View style={{ flex: 1 }}><Text style={s.title}>{d.code}</Text><Text style={{ color: c.muted }}>Order {d.orderNumber}</Text></View><View style={[s.chip, { backgroundColor: st.bg }]}><Text style={{ color: st.fg, fontWeight: '800', fontSize: 12 }}>{st.label}</Text></View></View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 180, gap: 14 }}>
        <View style={s.card}><DeliveryMap hub={d.pickup} drop={d.drop} me={me} height={200} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14 }}>
            <View><Text style={s.k}>{closed ? (d.status === 'delivered' ? 'DELIVERED' : 'FAILED') : pre ? 'PICKUP AT HUB' : 'DELIVER BY'}</Text><Text style={s.big}>{closed ? tm(d.deliveredAt) : pre ? tm(d.scheduledPickupAt) : tm(d.etaAt)}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={s.k}>DISTANCE</Text><Text style={s.big}>{closed ? '–' : `${d.remainingKm} km`}</Text></View>
          </View>
          {!closed && <Text style={{ paddingHorizontal: 14, paddingBottom: 14, color: d.late ? c.red : c.green, fontWeight: '800' }}>{d.late ? 'Running late — please hurry' : ml >= 0 ? `Customer expects you in ${ml} min` : 'Due now'} · promised by {tm(d.promisedBy)}</Text>}
          {denied && tripOn && <Text style={{ paddingHorizontal: 14, paddingBottom: 14, color: c.red, fontWeight: '700' }}>Location permission is off — customers can't see you live.</Text>}
        </View>

        {d.status !== 'failed' && <View style={[s.card, { padding: 16 }]}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{STEPS.map(([k, l]) => { const on = idx >= ORDER.indexOf(k); return <View key={k} style={{ alignItems: 'center', flex: 1 }}><View style={[s.dotS, on && { backgroundColor: c.green }]}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>{on ? '✓' : ''}</Text></View><Text style={{ fontSize: 11, fontWeight: '700', color: on ? c.text : c.faint, marginTop: 6 }}>{l}</Text></View>; })}</View></View>}
        {d.status === 'failed' && <View style={[s.card, { padding: 16, backgroundColor: c.redBg }]}><Text style={{ color: c.red, fontWeight: '800' }}>Delivery failed</Text><Text style={{ color: c.red, marginTop: 4 }}>{d.failedReason}</Text></View>}

        {d.payLater && !closed && <View style={[s.card, { padding: 14, backgroundColor: c.greenBg }]}><Text style={{ fontWeight: '800', color: c.green }}>Pay later order. Nothing to collect.</Text></View>}
        {d.collect > 0 && !closed && <View style={[s.card, { padding: 16, backgroundColor: c.amberBg, borderColor: '#F3D9A0' }]}><Text style={{ fontWeight: '800', color: '#8A5A00' }}>Collect payment on delivery</Text><Text style={{ fontSize: 28, fontWeight: '800', color: '#8A5A00', marginTop: 2 }}>{inr(d.collect)}</Text><Text style={{ color: '#8A5A00' }}>{d.payment}</Text></View>}

        <View style={[s.card, { padding: 16, gap: 10 }]}><Text style={s.h}>{pre ? 'Pickup' : 'Drop'} location</Text>
          {pre ? <><Text style={s.name}>{d.pickup.name}</Text><Text style={s.addr}>{d.pickup.address}</Text></> : <><Text style={s.name}>{d.drop.name}</Text><Text style={s.addr}>{d.drop.address}{d.drop.landmark ? `\nNear ${d.drop.landmark}` : ''}</Text></>}
          <View style={{ flexDirection: 'row', gap: 10 }}><Pressable style={s.ghost} onPress={nav}><Text style={s.ghostT}>🧭 Navigate</Text></Pressable><Pressable style={s.ghost} onPress={call}><Text style={s.ghostT}>📞 Call customer</Text></Pressable></View>
          {!!d.notes && <View style={{ backgroundColor: c.cream, padding: 10, borderRadius: 10 }}><Text style={{ color: c.text }}>Note: {d.notes}</Text></View>}</View>

        <View style={[s.card, { padding: 16, gap: 8 }]}><Text style={s.h}>Load ({d.items.length} item{d.items.length > 1 ? 's' : ''})</Text>{d.items.map((i: any, k: number) => <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ flex: 1, color: c.text }}>{i.name}</Text><Text style={{ fontWeight: '800', color: c.text }}>{i.qty} {i.unit}</Text></View>)}</View>

        {!closed && <Pressable onPress={() => setFailOpen(true)}><Text style={{ textAlign: 'center', color: c.red, fontWeight: '700', padding: 8 }}>Report a problem</Text></Pressable>}
      </ScrollView>

      {next && <View style={[s.bar, { paddingBottom: ins.bottom + 12 }]}>{!!err && !otpOpen && <Text style={{ color: c.red, textAlign: 'center', marginBottom: 6, fontWeight: '600' }}>{err}</Text>}<Text style={{ color: c.muted, textAlign: 'center', marginBottom: 8 }}>{next.hint}</Text>
        <Pressable disabled={busy} onPress={press} style={[s.cta, busy && { opacity: 0.6 }]}><Text style={s.ctaT}>{busy ? 'Please wait…' : next.label}</Text></Pressable></View>}
      {closed && <View style={[s.bar, { paddingBottom: ins.bottom + 12 }]}><Pressable onPress={() => navigation.goBack()} style={[s.cta, { backgroundColor: c.navy }]}><Text style={s.ctaT}>Back to deliveries</Text></Pressable></View>}

      <Modal visible={otpOpen} transparent animationType="slide" onRequestClose={() => setOtpOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}><View style={s.sheet}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.text }}>Complete delivery</Text><Text style={{ color: c.muted, marginTop: 4 }}>Ask {d.drop.name.split(' ')[0]} for the 4-digit code shown in their order tracking.</Text>
          <TextInput value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} placeholder="• • • •" placeholderTextColor={c.faint} style={s.otp} autoFocus />
          <TextInput value={note} onChangeText={setNote} placeholder="Note (optional) — e.g. left at gate" placeholderTextColor={c.faint} style={s.note} />
          {d.collect > 0 && <><Text style={{ color: '#8A5A00', fontWeight: '800', marginTop: 10 }}>Collect {inr(d.collect)} before confirming.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{(['Cash', 'UPI'] as const).map((m) => <Pressable key={m} onPress={() => setMode(m)} style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 99, borderWidth: 1.5, borderColor: mode === m ? c.orange : c.border, backgroundColor: mode === m ? c.orangeBg : '#fff' }}><Text style={{ fontWeight: '800', color: mode === m ? c.orange : c.muted }}>Received by {m}</Text></Pressable>)}</View></>}
          {d.payLater && <Text style={{ color: c.green, fontWeight: '800', marginTop: 10 }}>Pay later order. Nothing to collect.</Text>}
          {!!err && <Text style={{ color: c.red, marginTop: 10, fontWeight: '700' }}>{err}</Text>}
          <Pressable disabled={busy || otp.length !== 4} onPress={async () => { if (await act('deliver', { otp, note, mode })) setOtpOpen(false); }} style={[s.cta, { marginTop: 16 }, (busy || otp.length !== 4) && { opacity: 0.5 }]}><Text style={s.ctaT}>{busy ? 'Verifying…' : 'Confirm delivery'}</Text></Pressable>
          <Pressable onPress={() => setOtpOpen(false)}><Text style={{ textAlign: 'center', color: c.muted, fontWeight: '700', marginTop: 14 }}>Cancel</Text></Pressable>
        </View></KeyboardAvoidingView>
      </Modal>
      <Modal visible={failOpen} transparent animationType="slide" onRequestClose={() => setFailOpen(false)}>
        <View style={s.overlay}><View style={s.sheet}><Text style={{ fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 10 }}>What went wrong?</Text>
          {REASONS.map((r) => <Pressable key={r} style={s.reason} onPress={() => Alert.alert('Report problem?', `${r}. Dispatch will be notified.`, [{ text: 'Cancel' }, { text: 'Report', style: 'destructive', onPress: async () => { if (await act('fail', { reason: r })) setFailOpen(false); } }])}><Text style={{ fontWeight: '700', color: c.text }}>{r}</Text></Pressable>)}
          <Pressable onPress={() => setFailOpen(false)}><Text style={{ textAlign: 'center', color: c.muted, fontWeight: '700', marginTop: 12 }}>Close</Text></Pressable></View></View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: c.border }, back: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 20, fontWeight: '800', color: c.text }, chip: { paddingHorizontal: 10, height: 26, borderRadius: 99, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }, k: { color: c.faint, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }, big: { fontSize: 26, fontWeight: '800', color: c.text, marginTop: 2 }, h: { fontWeight: '800', fontSize: 15, color: c.text },
  dotS: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E4E7EC', alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 18, fontWeight: '800', color: c.text }, addr: { color: c.muted, lineHeight: 20 },
  ghost: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }, ghostT: { fontWeight: '800', color: c.text },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: c.border }, cta: { height: 56, borderRadius: 16, backgroundColor: c.orange, alignItems: 'center', justifyContent: 'center' }, ctaT: { color: '#fff', fontWeight: '800', fontSize: 17 },
  overlay: { flex: 1, backgroundColor: 'rgba(20,35,63,.5)', justifyContent: 'flex-end' }, sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  otp: { height: 70, borderRadius: 16, borderWidth: 2, borderColor: c.orange, textAlign: 'center', fontSize: 34, fontWeight: '800', letterSpacing: 12, marginTop: 16, color: c.text }, note: { height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, paddingHorizontal: 14, marginTop: 12, fontSize: 15, color: c.text },
  reason: { padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: c.border, marginBottom: 8 },
});
