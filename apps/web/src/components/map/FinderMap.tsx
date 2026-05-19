'use client';

import maplibregl, { LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, type CategoryId } from '@bharat/scraper';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toaster';

/** Lightweight polygon draw: click to add vertices, double-click to close. */
interface PolygonState {
  points: Array<[number, number]>;
  closed: boolean;
}

const INITIAL_CENTER: LngLatLike = [77.5946, 12.9716]; // Bengaluru
const INITIAL_ZOOM = 12;

export function FinderMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [poly, setPoly] = useState<PolygonState>({ points: [], closed: false });
  const [selected, setSelected] = useState<Set<CategoryId>>(new Set(['catering.restaurant']));
  const { push } = useToast();

  const search = trpc.leads.searchInArea.useMutation({
    onSuccess: (r) => {
      push({ title: `Found ${r.inserted} verified leads`, description: 'Saved to your pipeline.' });
    },
    onError: (err) => push({ title: 'Search failed', description: err.message, variant: 'destructive' }),
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const style =
      process.env.NEXT_PUBLIC_PROTOMAPS_KEY
        ? `https://api.protomaps.com/styles/v2/light.json?key=${process.env.NEXT_PUBLIC_PROTOMAPS_KEY}`
        : {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap',
              },
            },
            layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
          };
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: style as unknown as maplibregl.StyleSpecification,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    mapRef.current = map;
    map.on('load', () => {
      map.addSource('poly', { type: 'geojson', data: emptyFC() });
      map.addLayer({
        id: 'poly-fill',
        type: 'fill',
        source: 'poly',
        paint: { 'fill-color': '#1d4ed8', 'fill-opacity': 0.18 },
      });
      map.addLayer({
        id: 'poly-line',
        type: 'line',
        source: 'poly',
        paint: { 'line-color': '#1d4ed8', 'line-width': 2 },
      });
    });
    map.on('click', (e) => {
      setPoly((curr) => {
        if (curr.closed) return curr;
        return { points: [...curr.points, [e.lngLat.lng, e.lngLat.lat]], closed: false };
      });
    });
    map.on('dblclick', (e) => {
      e.preventDefault();
      setPoly((curr) => (curr.points.length >= 3 ? { ...curr, closed: true } : curr));
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const src = m.getSource('poly') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(toFc(poly));
  }, [poly]);

  const handleSearch = () => {
    if (poly.points.length < 3) {
      push({ title: 'Draw at least 3 points', variant: 'destructive' });
      return;
    }
    search.mutate({
      polygon: poly.points,
      categories: Array.from(selected),
      limit: 100,
    });
  };

  return (
    <div className="grid h-[calc(100dvh-4rem)] grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-4 border-r bg-card p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Lead finder</h2>
          <p className="text-xs text-muted-foreground">
            Click on the map to add vertices. Double-click to close the polygon. Then choose categories and search.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories</p>
          <div className="max-h-72 space-y-1 overflow-auto rounded-lg border p-2 text-sm">
            {CATEGORIES.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-secondary">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={(e) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      e.target.checked ? next.add(c.id) : next.delete(c.id);
                      return next;
                    })
                  }
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
        <Button onClick={handleSearch} loading={search.isPending} disabled={!poly.closed} size="lg">
          Find leads
        </Button>
        <Button variant="outline" onClick={() => setPoly({ points: [], closed: false })} size="sm">
          Clear polygon
        </Button>
        <p className="mt-auto text-xs text-muted-foreground">
          Source: Geoapify Places. Every lead is persisted with{' '}
          <code>source_url</code> + <code>source_verified_at</code> for DPDP §3(c)(ii) compliance.
        </p>
      </aside>
      <div ref={containerRef} className="relative" />
    </div>
  );
}

function emptyFC(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

function toFc(p: PolygonState): GeoJSON.FeatureCollection {
  if (p.points.length < 2) return emptyFC();
  const coords = [...p.points];
  if (p.closed) coords.push(p.points[0]!);
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: p.closed ? 'Polygon' : 'LineString', coordinates: p.closed ? [coords] : coords } as never,
      },
    ],
  };
}
