import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const DEFAULT_SERVER = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
const mem: Record<string, string> = {};
const store = {
  get: async (k: string) => { try { return Platform.OS === 'web' ? localStorage.getItem(k) : await SecureStore.getItemAsync(k); } catch { return mem[k] ?? null; } },
  set: async (k: string, v: string) => { try { Platform.OS === 'web' ? localStorage.setItem(k, v) : await SecureStore.setItemAsync(k, v); } catch { mem[k] = v; } },
  del: async (k: string) => { try { Platform.OS === 'web' ? localStorage.removeItem(k) : await SecureStore.deleteItemAsync(k); } catch { delete mem[k]; } },
};
export const session = {
  server: DEFAULT_SERVER, token: null as string | null,
  async load() { this.server = (await store.get('server')) || DEFAULT_SERVER; this.token = await store.get('token'); },
  async save(server: string, token: string) { this.server = server.replace(/\/+$/, ''); this.token = token; await store.set('server', this.server); await store.set('token', token); },
  async clear() { this.token = null; await store.del('token'); },
};
export class ApiError extends Error { status: number; constructor(s: number, m: string) { super(m); this.status = s; } }

export async function api<T = any>(path: string, body?: any, method?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${session.server}/api/driver${path}`, { method: method || (body !== undefined ? 'POST' : 'GET'), headers: { 'content-type': 'application/json', ...(session.token ? { authorization: `Bearer ${session.token}` } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch { throw new ApiError(0, `Can't reach the server at ${session.server}. Check your internet and server address.`); }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error || 'Request failed');
  return json;
}
