import { useMemo } from 'react';
import Svg, { Circle, Defs, G, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';

type P = { lat: number; lng: number };
export default function DeliveryMap({ hub, drop, me, trail = [], height = 220, width = 360 }: { hub: P; drop: P; me?: P | null; trail?: P[]; height?: number; width?: number }) {
  const W = 360, H = (height / width) * 360, pad = 38;
  const g = useMemo(() => {
    const pts = [hub, drop, ...(me ? [me] : []), ...trail];
    const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length, kx = Math.cos((lat0 * Math.PI) / 180);
    const xs = pts.map((p) => p.lng * kx), ys = pts.map((p) => -p.lat);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sc = Math.min((W - pad * 2) / Math.max(maxX - minX, 0.004), (H - pad * 2) / Math.max(maxY - minY, 0.004));
    const ox = (W - (maxX - minX) * sc) / 2, oy = (H - (maxY - minY) * sc) / 2;
    return { X: (p: P) => ox + (p.lng * kx - minX) * sc, Y: (p: P) => oy + (-p.lat - minY) * sc };
  }, [hub, drop, me, trail]);
  const { X, Y } = g;
  const trailD = trail.map((p, i) => `${i ? 'L' : 'M'}${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ');
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${W} ${H}`}>
      <Defs><Pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><Path d="M30 0H0V30" fill="none" stroke="#DDE3EA" strokeWidth="1" /></Pattern></Defs>
      <Rect width={W} height={H} fill="#EEF2F6" /><Rect width={W} height={H} fill="url(#grid)" />
      <Path d={`M0 ${H * 0.7} C ${W * 0.3} ${H * 0.55}, ${W * 0.6} ${H * 0.85}, ${W} ${H * 0.5}`} stroke="#fff" strokeWidth="8" fill="none" />
      <Path d={`M${X(hub)},${Y(hub)} L${X(drop)},${Y(drop)}`} stroke="#9AA3B2" strokeWidth="2" strokeDasharray="5 6" />
      {trail.length > 1 && <Path d={trailD} stroke="#E4572E" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <G transform={`translate(${X(hub)},${Y(hub)})`}><Rect x="-12" y="-12" width="24" height="24" rx="6" fill="#14233F" /><Path d="M-6 3l6-6 6 6v5h-4v-3h-4v3h-4z" fill="#fff" /><SvgText y="26" fontSize="10" fontWeight="700" fill="#14233F" textAnchor="middle">Hub</SvgText></G>
      <G transform={`translate(${X(drop)},${Y(drop)})`}><Path d="M0 0c-8-10-13-14-13-21a13 13 0 0126 0c0 7-5 11-13 21z" fill="#E4572E" stroke="#fff" strokeWidth="2" /><Circle cy="-21" r="4.5" fill="#fff" /><SvgText y="14" fontSize="10" fontWeight="700" fill="#14233F" textAnchor="middle">Drop</SvgText></G>
      {me && <G transform={`translate(${X(me)},${Y(me)})`}><Circle r="16" fill="#2F6FEB" opacity=".18" /><Circle r="9" fill="#fff" /><Circle r="6" fill="#2F6FEB" /></G>}
    </Svg>
  );
}
