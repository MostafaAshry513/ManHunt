/** Pure geospatial helpers. No I/O so they are trivially testable. */

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_008.8;

export function isFiniteCoord(p: LatLng | undefined | null): p is LatLng {
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    && p.lat >= -90 && p.lat <= 90
    && p.lng >= -180 && p.lng <= 180;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Point at `distanceM` from `center` along `bearingRad` (0 = north). */
export function destination(center: LatLng, bearingRad: number, distanceM: number): LatLng {
  const d = distanceM / EARTH_RADIUS_M;
  const lat1 = (center.lat * Math.PI) / 180;
  const lng1 = (center.lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad),
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
  );

  return { lat: (lat2 * 180) / Math.PI, lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180 };
}

/** Approximates a circle as a closed polygon - used for drawn zones. */
export function circlePolygon(center: LatLng, radiusM: number, segments = 64): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i < segments; i++) {
    pts.push(destination(center, (i / segments) * 2 * Math.PI, radiusM));
  }
  return pts;
}

export function pointInCircle(p: LatLng, center: LatLng, radiusM: number): boolean {
  return haversineMeters(p, center) <= radiusM;
}

/** Ray casting on lng/lat. Adequate for game-sized polygons away from the poles/antimeridian. */
export function pointInPolygon(p: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const intersects = (a.lat > p.lat) !== (b.lat > p.lat)
      && p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function shrinkRadius(currentM: number, stepM: number, minM: number): number {
  return Math.max(minM, currentM - Math.max(0, stepM));
}

/** Implied speed in m/s between two timestamped points. */
export function impliedSpeedMps(
  prev: { p: LatLng; t: number },
  next: { p: LatLng; t: number },
): number {
  const dtSec = (next.t - prev.t) / 1000;
  if (dtSec <= 0) return Number.POSITIVE_INFINITY;
  return haversineMeters(prev.p, next.p) / dtSec;
}

/** Rough polygon area in m^2 via local equirectangular projection + shoelace. */
export function polygonAreaM2(polygon: LatLng[]): number {
  if (polygon.length < 3) return 0;
  const lat0 = (polygon.reduce((s, p) => s + p.lat, 0) / polygon.length) * (Math.PI / 180);
  const mPerDegLat = 111_132;
  const mPerDegLng = 111_320 * Math.cos(lat0);
  let sum = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    sum += (b.lng * mPerDegLng) * (a.lat * mPerDegLat) - (a.lng * mPerDegLng) * (b.lat * mPerDegLat);
  }
  return Math.abs(sum) / 2;
}
