import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issue with Vite
// @ts-expect-error -- leaflet internal
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAT = -22.925;
const LON = -45.462;

/**
 * InteractiveMap — dark-themed Leaflet map centered on Pindamonhangaba.
 *
 * CartoDB dark matter tiles. Scroll zoom disabled by default
 * (enabled on map click to prevent scroll hijacking).
 * Marker popup with station info.
 */
export default function InteractiveMap() {
    const mapRef = useRef<L.Map | null>(null);

    // Enable scroll zoom on map click, disable on blur
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const enableZoom = () => map.scrollWheelZoom.enable();
        const disableZoom = () => map.scrollWheelZoom.disable();

        map.on('click', enableZoom);
        map.on('blur', disableZoom);
        document.addEventListener('click', (e) => {
            const container = map.getContainer();
            if (!container.contains(e.target as Node)) {
                disableZoom();
            }
        });

        return () => {
            map.off('click', enableZoom);
            map.off('blur', disableZoom);
        };
    }, []);

    return (
        <div
            style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                height: '360px',
            }}
        >
            <MapContainer
                center={[LAT, LON]}
                zoom={12}
                scrollWheelZoom={false}
                style={{ width: '100%', height: '100%' }}
                ref={mapRef}
                aria-label="Mapa de Pindamonhangaba mostrando a localização da estação climática"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={19}
                />
                <Marker position={[LAT, LON]}>
                    <Popup>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', lineHeight: 1.5 }}>
                            <strong style={{ fontFamily: "'Syne', sans-serif" }}>Pindamonhangaba, SP</strong>
                            <br />
                            <span style={{ color: '#666' }}>
                                {LAT}°, {LON}°
                            </span>
                            <br />
                            85 anos de dados climáticos
                            <br />
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>ERA5 / Copernicus Reanalysis</span>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
