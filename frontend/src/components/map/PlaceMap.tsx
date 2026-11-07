import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, NavigationControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Place } from '../../types/place';
import { AlertTriangle, Compass, Navigation } from 'lucide-react';

interface PlaceMapProps {
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  userLocation?: { lat: number; lng: number; accuracy?: number } | null;
  onSearchArea?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  className?: string;
}

export const PlaceMap: React.FC<PlaceMapProps> = ({
  places,
  selectedPlaceId,
  onSelectPlace,
  userLocation,
  onSearchArea,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{ [id: string]: Marker }>({});
  const userMarkerRef = useRef<Marker | null>(null);

  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState<boolean>(false);

  // Map style URL: from .env, or non-token open vector tile style
  const styleUrl =
    import.meta.env.VITE_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json';

  // Fly to user location helper
  const handleRecenterOnUser = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      speed: 1.4,
      essential: true,
    });
  }, [userLocation]);

  // 1. Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: styleUrl,
        center: [72.8777, 19.0760], // Default center: Metro City (Mumbai)
        zoom: 11,
        attributionControl: false,
      });

      // Add navigation controls (zoom + compass)
      map.addControl(new NavigationControl({ showCompass: true }), 'top-right');

      map.on('load', () => {
        mapInstanceRef.current = map;
        setIsMapReady(true);
      });

      map.on('moveend', () => {
        if (onSearchArea) {
          setShowSearchAreaButton(true);
        }
      });

      map.on('error', (e) => {
        console.warn('MapLibre GL encountered a rendering or resource event:', e);
      });

      return () => {
        map.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
      };
    } catch (err: unknown) {
      console.error('Failed to initialize MapLibre GL:', err);
      const msg = err instanceof Error ? err.message : 'WebGL or canvas rendering is not supported.';
      setMapError(`Map preview unavailable: ${msg}`);
    }
  }, [styleUrl]);

  // 2. Synchronize Place Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    // Remove old place markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const bounds = new maplibregl.LngLatBounds();
    let hasValidCoord = false;

    // Include user location in bounds calculation if present
    if (userLocation && typeof userLocation.lng === 'number' && typeof userLocation.lat === 'number') {
      bounds.extend([userLocation.lng, userLocation.lat]);
      hasValidCoord = true;
    }

    if (places.length > 0) {
      places.forEach((place) => {
        if (typeof place.longitude !== 'number' || typeof place.latitude !== 'number') return;
        if (isNaN(place.longitude) || isNaN(place.latitude)) return;

        const isSelected = place.id === selectedPlaceId;

        // Custom marker DOM element
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `place-map-marker group transition-all duration-200 cursor-pointer ${
          isSelected ? 'z-30 scale-125' : 'z-10 hover:scale-110'
        }`;
        el.setAttribute('aria-label', `Select ${place.name}`);

        el.innerHTML = `
          <div style="
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            background-color: ${isSelected ? '#f59e0b' : '#0d9488'};
            border: 2px solid #ffffff;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s;
          ">
            <svg style="width: 14px; height: 14px; color: ${isSelected ? '#0f172a' : '#ffffff'};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectPlace(place.id);
        });

        const marker = new Marker({ element: el })
          .setLngLat([place.longitude, place.latitude])
          .addTo(map);

        markersRef.current[place.id] = marker;
        bounds.extend([place.longitude, place.latitude]);
        hasValidCoord = true;
      });
    }

    // Auto-fit bounds if multiple points exist and user hasn't explicitly selected one
    if (hasValidCoord && !selectedPlaceId && (places.length > 1 || (places.length === 1 && userLocation))) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
    } else if (userLocation && places.length === 0 && !selectedPlaceId) {
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        speed: 1.2,
      });
    }
  }, [places, selectedPlaceId, isMapReady, onSelectPlace, userLocation]);

  // 3. User Current Location Pin with Real-time Radar Pulse and Accuracy Popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && typeof userLocation.lng === 'number' && typeof userLocation.lat === 'number') {
      const userEl = document.createElement('div');
      userEl.className = 'user-device-location-container';
      userEl.style.cssText = 'position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;';

      const accuracyBadge = userLocation.accuracy
        ? `<div style="font-size: 10px; color: #0F766E; font-weight: 500; margin-top: 2px;">Accuracy: ±${Math.round(userLocation.accuracy)}m</div>`
        : '';

      userEl.innerHTML = `
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.25);
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 18px;
          height: 18px;
          background-color: #0F766E;
          border: 3px solid #ffffff;
          border-radius: 9999px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 4px; height: 4px; background: #ffffff; border-radius: 9999px;"></div>
        </div>
      `;

      const popup = new Popup({ offset: 16, closeButton: false })
        .setHTML(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px 4px; text-align: center;">
            <div style="font-weight: 700; color: #102A43;">Your Current Location</div>
            ${accuracyBadge}
          </div>
        `);

      const marker = new Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(popup)
        .addTo(map);

      userMarkerRef.current = marker;
    }
  }, [userLocation, isMapReady]);

  // 4. Center on Selected Place
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady || !selectedPlaceId) return;

    const selected = places.find((p) => p.id === selectedPlaceId);
    if (selected && selected.longitude && selected.latitude) {
      map.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: 14,
        speed: 1.2,
        essential: true,
      });
    }
  }, [selectedPlaceId, places, isMapReady]);

  if (mapError) {
    return (
      <div className={`p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-col items-center justify-center text-center ${className}`}>
        <AlertTriangle className="w-8 h-8 text-amber-600 mb-2" />
        <h4 className="font-bold text-sm text-amber-950">Map View Offline</h4>
        <p className="text-xs text-amber-800 mt-1 max-w-sm">
          {mapError}
        </p>
        <p className="text-[11px] text-amber-700/80 mt-2 font-mono">
          All venues remain discoverable via the List View.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating "Search This Area" Button */}
      {showSearchAreaButton && onSearchArea && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                const b = mapInstanceRef.current.getBounds();
                onSearchArea({
                  north: b.getNorth(),
                  south: b.getSouth(),
                  east: b.getEast(),
                  west: b.getWest(),
                });
                setShowSearchAreaButton(false);
              }
            }}
            className="px-4 py-2 rounded-full bg-white text-teal-700 text-xs font-bold shadow-lg border border-teal-200 hover:bg-teal-50 transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xl"
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>Search This Area</span>
          </button>
        </div>
      )}

      {/* Floating "Center on Me" Button (when device location active) */}
      {userLocation && (
        <div className="absolute top-4 right-14 z-20">
          <button
            type="button"
            onClick={handleRecenterOnUser}
            className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs text-[#0F766E] text-xs font-bold shadow-md border border-slate-200 hover:bg-[#E8F5F1] transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-lg"
            title="Recenter map on your current GPS location"
          >
            <Navigation className="w-3.5 h-3.5 fill-[#0F766E] text-[#0F766E]" />
            <span className="hidden sm:inline">Center on Me</span>
          </button>
        </div>
      )}

      {/* Legend & Spatial Attribution Overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs border border-slate-700/60 shadow-lg pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
            <span>Venues ({places.length})</span>
          </span>
          {userLocation && (
            <button
              type="button"
              onClick={handleRecenterOnUser}
              className="flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 pointer-events-auto cursor-pointer transition-colors"
              title="Click to center map on your location"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Your Location {userLocation.accuracy ? `(±${Math.round(userLocation.accuracy)}m)` : ''}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-300 font-mono">
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span>PostGIS SRID 4326</span>
        </div>
      </div>
    </div>
  );
};
