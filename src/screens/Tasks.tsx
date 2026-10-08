import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { c, statusStyle, tm, inr, minsLeft } from '../theme';
import { useDriver } from '../../App';
import { useLocationSharing } from '../location';

export default function Tasks({ navigation }: any) {
  const { driver, setDriver, signOut } = useDriver(); const ins = useSafeAreaInsets();
  const [data, setData] = useState<{ active: any[]; completed: any[] } | null>(null); const [tab, setTab] = useState<'active' | 'completed'>('active'); const [refreshing, setRefreshing] = useState(false); const [err, setErr] = useState('');
  const load = useCallback(async () => { try { const r = await api('/deliveries'); setData(r); setDriver(r.driver); setErr(''); } catch (e: any) { setErr(e.message); if (e.status === 401) signOut(); } }, []);
  useFocusEffect(useCallback(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]));
  const online = driver.status !== 'offline';
  const inTrip = !!data?.active.some((d) => ['picked_up', 'out_for_delivery', 'arrived'].includes(d.status));
  useLocationSharing(online && inTrip);
  const toggle = async (v: boolean) => { try { const r = await api('/me/status', { status: v ? 'available' : 'offline' }); setDriver(r.driver); } catch (e: any) { Alert.alert('Can\'t change status', e.message); } };
  const list = data ? data[tab] : [];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[s.head, { paddingTop: ins.top + 12 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><Text style={s.hi}>Hi, {driver.name.split(' ')[0]} 👋</Text><Text style={s.veh}>{driver.vehicle?.type} · {driver.vehicle?.number}</Text></View>
          <Pressable onPress={() => Alert.alert('Sign out?', '', [{ text: 'Cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut }])} style={s.out}><Text style={{ color: '#fff', fontWeight: '700' }}>Sign out</Text></Pressable>
        </View>
        <View style={s.online}><View style={{ flex: 1 }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{online ? 'You are online' : 'You are offline'}</Text><Text style={{ color: '#B9C6E4', marginTop: 2 }}>{online ? 'Dispatch can assign you deliveries' : 'Go online to receive deliveries'}</Text></View><Switch value={online} onValueChange={toggle} trackColor={{ true: c.green, false: '#4A5C80' }} thumbColor="#fff" /></View>
        <View style={s.stats}>{[[driver.active ?? 0, 'Active'], [driver.deliveredToday ?? 0, 'Delivered today'], [driver.onTimePct != null ? driver.onTimePct + '%' : '–', 'On time']].map(([v, l]) => <View key={String(l)} style={s.stat}><Text style={s.statV}>{v}</Text><Text style={s.statL}>{l}</Text></View>)}</View>
      </View>
      <View style={s.tabs}>{(['active', 'completed'] as const).map((t) => <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}><Text style={[s.tabT, tab === t && { color: '#fff' }]}>{t === 'active' ? `Active (${data?.active.length ?? 0})` : `Today (${data?.completed.length ?? 0})`}</Text></Pressable>)}</View>
      {!!err && <Text style={s.err}>{err}</Text>}
      <FlatList data={list} keyExtractor={(d) => d.id} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 50 }}><Text style={{ fontSize: 40 }}>{tab === 'active' ? '📭' : '✅'}</Text><Text style={{ fontWeight: '800', fontSize: 18, color: c.text, marginTop: 8 }}>{data ? (tab === 'active' ? 'No deliveries right now' : 'Nothing completed today') : 'Loading…'}</Text>{tab === 'active' && data && <Text style={{ color: c.muted, marginTop: 4, textAlign: 'center' }}>{online ? "You're online — new assignments appear here." : 'Go online to get assignments.'}</Text>}</View>}
        renderItem={({ item: d }) => {
          const st = statusStyle[d.status] || statusStyle.assigned, ml = minsLeft(d.etaAt), pre = ['assigned', 'accepted'].includes(d.status);
          return (
            <Pressable style={s.card} onPress={() => navigation.navigate('Delivery', { id: d.id })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={s.code}>{d.code}</Text><View style={[s.chip, { backgroundColor: st.bg }]}><Text style={{ color: st.fg, fontWeight: '800', fontSize: 12 }}>{st.label}</Text></View></View>
              <Text style={s.name}>{d.drop.name}</Text><Text style={s.addr} numberOfLines={2}>📍 {d.drop.address}</Text>
              <View style={s.row}><Text style={s.meta}>{d.distanceKm} km</Text><Text style={s.dot}>·</Text><Text style={s.meta}>{d.items.length} item{d.items.length > 1 ? 's' : ''}</Text>{d.collect > 0 && <><Text style={s.dot}>·</Text><Text style={[s.meta, { color: c.red, fontWeight: '800' }]}>Collect {inr(d.collect)}</Text></>}</View>
              {['delivered', 'failed'].includes(d.status) ? <Text style={s.when}>{d.status === 'delivered' ? `Delivered ${tm(d.deliveredAt)}` : d.failedReason}</Text> :
                <View style={s.foot}><View><Text style={s.footL}>{pre ? 'Pickup at hub' : 'Deliver by'}</Text><Text style={s.footV}>{pre ? tm(d.scheduledPickupAt) : tm(d.etaAt)}</Text></View><Text style={{ color: d.late ? c.red : c.green, fontWeight: '800' }}>{d.late ? 'Running late' : ml >= 0 ? `in ${ml} min` : 'due now'}</Text></View>}
            </Pressable>);
        }} />
    </View>
  );
}
const s = StyleSheet.create({
  head: { backgroundColor: c.navy, paddingHorizontal: 18, paddingBottom: 18 }, hi: { color: '#fff', fontSize: 24, fontWeight: '800' }, veh: { color: '#B9C6E4', marginTop: 2 }, out: { backgroundColor: c.navy2, paddingHorizontal: 14, height: 36, borderRadius: 10, justifyContent: 'center' },
  online: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.navy2, borderRadius: 16, padding: 14, marginTop: 16 }, stats: { flexDirection: 'row', gap: 10, marginTop: 12 }, stat: { flex: 1, backgroundColor: c.navy2, borderRadius: 14, padding: 12 }, statV: { color: '#fff', fontSize: 22, fontWeight: '800' }, statL: { color: '#B9C6E4', fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }, tab: { paddingHorizontal: 16, height: 36, borderRadius: 99, borderWidth: 1.5, borderColor: c.border, backgroundColor: '#fff', justifyContent: 'center' }, tabOn: { backgroundColor: c.navy, borderColor: c.navy }, tabT: { fontWeight: '700', color: c.text },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: c.border }, code: { fontWeight: '800', color: c.orange, fontSize: 15 }, chip: { paddingHorizontal: 10, height: 24, borderRadius: 99, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: c.text, marginTop: 8 }, addr: { color: c.muted, marginTop: 4, lineHeight: 19 }, row: { flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' }, meta: { color: c.muted, fontWeight: '600' }, dot: { color: c.faint },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border }, footL: { color: c.faint, fontSize: 12, fontWeight: '700' }, footV: { color: c.text, fontSize: 18, fontWeight: '800' }, when: { marginTop: 10, fontWeight: '700', color: c.muted }, err: { color: c.red, paddingHorizontal: 16, paddingTop: 10, fontWeight: '600' },
});
