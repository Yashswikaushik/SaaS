---
name: maplibre-geoapify
description: MapLibre GL map, Protomaps tiles, Geoapify Places API. Use when building map views, polygon search, or geocoding. Trigger on mentions of map, polygon, geocode, Geoapify, MapLibre. NEVER use Google Maps APIs.
---

# MapLibre + Geoapify

## Map setup
```tsx
'use client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: ref.current!,
  style: 'https://api.protomaps.com/styles/v2/light.json?key=' + key,
  center: [77.5946, 12.9716], // Bengaluru
  zoom: 11,
});
```

## Polygon draw
```tsx
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: { polygon: true, trash: true },
});
map.addControl(draw);
map.on('draw.create', (e) => onPolygon(e.features[0].geometry.coordinates));
```

## Geoapify Places search
```ts
const url = new URL('https://api.geoapify.com/v2/places');
url.searchParams.set('categories', 'catering.restaurant'); // strict allow-list
url.searchParams.set('filter', `geometry:${wkt}`); // WKT polygon
url.searchParams.set('limit', '500');
url.searchParams.set('apiKey', env.GEOAPIFY_API_KEY);
const res = await fetch(url);
```

## Category allow-list
We expose only these to users (Geoapify category strings):
- `catering.restaurant`, `catering.cafe`, `catering.bar`
- `commercial.shopping_mall`, `commercial.supermarket`
- `service.financial`, `service.beauty`
- `healthcare.clinic_or_praxis`, `healthcare.dentist`
- `accommodation.hotel`
- `education.school`, `education.driving_school`
- `office.company`

Disallowed: `internet_access`, `pet`, `tourism.attraction` (no business utility).

## Density clustering
Use `maplibre-gl`'s built-in clustering on the leads source:
```ts
map.addSource('leads', {
  type: 'geojson',
  data: leadsGeoJson,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
});
```

## Caching
- Cache Geoapify results per `(category, polygon_hash)` for 24h in Redis.
- Polygon hash: stable hash of sorted coords (4 decimal precision).
- Cost target: ≤ ₹0.05/lead acquired.

## Forbidden
- Never use `https://maps.googleapis.com/*`
- Never use `google.maps.places.*`
- Never store Google Maps tile pixels (ToS §3.2.3)
