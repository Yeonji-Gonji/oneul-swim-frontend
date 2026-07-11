/**
 * 위치 유틸 — 거리 계산.
 * Geolocation 권한 획득/거부는 컴포넌트에서 navigator.geolocation 로 직접 다룬다.
 */

/** 두 좌표 사이 거리(km) — haversine. 좌표 결측이면 null */
export function distanceKm(
  aLat: number | null | undefined,
  aLng: number | null | undefined,
  bLat: number | null | undefined,
  bLng: number | null | undefined,
): number | null {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return null;
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** 거리 표시 라벨 — <1km는 m, 그 이상은 소수 1자리 km */
export function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
