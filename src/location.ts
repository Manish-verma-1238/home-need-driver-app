import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { api } from './api';

// Streams the driver's position to the server while `enabled` (online with an active delivery).
export function useLocationSharing(enabled: boolean) {
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [denied, setDenied] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null, dead = false;
    (async () => {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== 'granted') { setDenied(true); return; }
      setDenied(false);
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 }, (pos) => {
        if (dead) return;
        const lat = pos.coords.latitude, lng = pos.coords.longitude; setMe({ lat, lng });
        if (Date.now() - last.current > 7000) { last.current = Date.now(); api('/location', { lat, lng, speed: pos.coords.speed ?? 0 }).catch(() => {}); }
      });
    })();
    return () => { dead = true; sub?.remove(); };
  }, [enabled]);
  return { me, denied };
}
