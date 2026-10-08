export const c = { orange: '#E4572E', orangeBg: '#FDEEE8', navy: '#14233F', navy2: '#1D3157', cream: '#F7F3EE', bg: '#F5F6F8', card: '#FFFFFF', text: '#14233F', muted: '#6B7587', faint: '#9AA3B2', border: '#E4E7EC', green: '#0E9F7E', greenBg: '#E2F5EF', blue: '#2F6FEB', blueBg: '#EAF0FF', amber: '#D98A00', amberBg: '#FFF3DC', red: '#D8322C', redBg: '#FDECEC' };
export const statusStyle: Record<string, { fg: string; bg: string; label: string }> = {
  assigned: { fg: c.blue, bg: c.blueBg, label: 'New assignment' }, accepted: { fg: c.blue, bg: c.blueBg, label: 'Accepted' }, picked_up: { fg: c.orange, bg: c.orangeBg, label: 'Picked up' },
  out_for_delivery: { fg: c.amber, bg: c.amberBg, label: 'On the way' }, arrived: { fg: c.green, bg: c.greenBg, label: 'Arrived' }, delivered: { fg: c.green, bg: c.greenBg, label: 'Delivered' }, failed: { fg: c.red, bg: c.redBg, label: 'Failed' },
};
export const tm = (s?: string | null) => (s ? new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '–');
export const inr = (n = 0) => '₹' + Math.round(n).toLocaleString('en-IN');
export const minsLeft = (s?: string | null) => (s ? Math.round((+new Date(s) - Date.now()) / 60000) : 0);
