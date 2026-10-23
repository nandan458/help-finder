// The map: OpenStreetMap tiles, a pin for every place, a blue dot for you,
// and a dashed circle showing the area we searched.
//
// Leaflet draws the map. react-leaflet lets us describe it with React tags
// (<MapContainer>, <Marker>...) instead of calling Leaflet by hand.
// Pins close together are grouped into one numbered bubble (a "cluster")
// so the map stays readable when zoomed out.

// Loads the type definitions for the cluster plugin (L.MarkerCluster and friends).
/// <reference types="leaflet.markercluster" />
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import { useT } from "../i18n/useT";
import type { Category } from "../lib/categories";
import type { LatLng } from "../lib/geo";
import type { Origin } from "../lib/location";
import type { Place } from "../lib/overpass";
import { movedFarEnough } from "../lib/search";
import { CATEGORY_ICONS } from "./icons";
import { UiIcon } from "./UiIcon";
import "./MapView.css";

type Props = {
  origin: Origin;
  places: Place[];
  searchCenter?: LatLng;
  radiusM: number;
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSearchArea: (center: LatLng) => void;
  // How much of the map the panel covers (left on wide screens, bottom on
  // phones), so the app never centers things underneath it.
  coverLeft: number;
  coverBottom: number;
  isPhone: boolean;
  onSettings: () => void;
  onLocate: () => void;
  locating: boolean;
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// When showing an area, leave room for the panel and for the buttons on the right.
function fitPadding(coverLeft: number, coverBottom: number): L.FitBoundsOptions {
  return { paddingTopLeft: [coverLeft + 16, 16], paddingBottomRight: [72, coverBottom + 16] };
}

// Pin icons are made once per category (and once more for the bigger "selected"
// version) and reused, instead of building 170 new icons on every redraw.
const iconCache = new Map<string, L.DivIcon>();
function pinIcon(category: Category, selected: boolean): L.DivIcon {
  const key = `${category}-${selected}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const color = `--pin-color: var(--cat-${category})`;
    const svg = CATEGORY_ICONS[category];
    // A selected pin becomes a bigger balloon whose point sits on the place.
    icon = selected
      ? L.divIcon({
          className: "", // turn off Leaflet's default white square
          html: `<span class="pin pin-selected" style="${color}"><span>${svg}</span></span>`,
          iconSize: [46, 46],
          iconAnchor: [23, 56], // the balloon's point, below its middle
        })
      : L.divIcon({
          className: "",
          html: `<span class="pin" style="${color}">${svg}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
    iconCache.set(key, icon);
  }
  return icon;
}

// The numbered bubble that stands in for a group of nearby pins.
// Screen readers hear "12 places" instead of just "12".
function clusterIcon(cluster: L.MarkerCluster, t: ReturnType<typeof useT>["t"]): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "",
    html: `<span class="cluster"><span aria-hidden="true">${count}</span><span class="visually-hidden">${t("map.cluster", { count })}</span></span>`,
    iconSize: [40, 40],
  });
}

export function MapView(props: Props) {
  const { origin, places, searchCenter, radiusM, loading, selectedId, onSelect, onSearchArea } =
    props;
  const { coverLeft, coverBottom, isPhone, onSettings, onLocate, locating } = props;
  const { t } = useT();
  const [map, setMap] = useState<L.Map | null>(null);
  // Where the person last moved the map, and which search was showing then.
  // Remembering the search means a new search automatically hides the button.
  const [moved, setMoved] = useState<{ to: LatLng; after?: LatLng } | null>(null);

  const showSearchArea =
    !loading &&
    moved &&
    searchCenter &&
    moved.after === searchCenter &&
    movedFarEnough(searchCenter, moved.to, radiusM);

  return (
    <div className="map-wrap">
      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={14}
        // We draw our own zoom buttons and credit line, where the panel won't cover them.
        zoomControl={false}
        attributionControl={false}
        ref={setMap}
        className="map"
        zoomAnimation={!reduceMotion}
        fadeAnimation={!reduceMotion}
        markerZoomAnimation={!reduceMotion}
      >
        <TileLayer
          // OpenStreetMap's own tiles: free, no key. Their policy requires this credit line.
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          // Ask for tiles in "CORS" mode so the offline cache (vite.config.ts) can
          // see and store them. Otherwise each tile is a sealed box the browser
          // counts as megabytes of storage.
          crossOrigin=""
        />
        {/* OpenStreetMap's tile rules say this credit must stay visible. On phones
            the sheet covers the bottom, so there it goes at the top. */}
        <AttributionControl position={isPhone ? "topleft" : "bottomright"} />
        <MapLabel label={t("map.label")} />
        <FollowSearch
          origin={origin}
          searchCenter={searchCenter}
          radiusM={radiusM}
          coverLeft={coverLeft}
          coverBottom={coverBottom}
        />
        <TrackUserMoves onMoved={(to) => setMoved({ to, after: searchCenter })} />

        {searchCenter && radiusM > 0 && (
          <Circle
            center={[searchCenter.lat, searchCenter.lng]}
            radius={radiusM}
            interactive={false}
            className="search-circle"
          />
        )}

        <Pins places={places} selectedId={selectedId} onSelect={onSelect} />

        {/* You are here. A filled dot for real location; a ring for a typed or shared place. */}
        <CircleMarker
          center={[origin.lat, origin.lng]}
          radius={origin.source === "gps" ? 8 : 7}
          className={origin.source === "gps" ? "user-dot" : "typed-dot"}
          interactive={false}
        />
      </MapContainer>

      {/* Frosted buttons in the top-right corner. */}
      <div className="map-controls">
        <div className="control-group">
          <button
            type="button"
            className="control"
            onClick={onSettings}
            aria-label={t("settings.title")}
          >
            <UiIcon name="settings" />
          </button>
          <button
            type="button"
            className="control"
            onClick={onLocate}
            disabled={locating}
            aria-label={locating ? t("location.finding") : t("location.use")}
          >
            <UiIcon name="locate" />
          </button>
        </div>
        <div className="control-group">
          <button
            type="button"
            className="control"
            onClick={() => map?.zoomIn()}
            aria-label={t("map.zoomIn")}
          >
            <UiIcon name="plus" />
          </button>
          <button
            type="button"
            className="control"
            onClick={() => map?.zoomOut()}
            aria-label={t("map.zoomOut")}
          >
            <UiIcon name="minus" />
          </button>
        </div>
      </div>

      {showSearchArea && (
        <button
          type="button"
          className="search-area"
          onClick={() => moved && onSearchArea(moved.to)}
        >
          {t("map.searchArea")}
        </button>
      )}
    </div>
  );
}

/** All the place pins, grouped into clusters. Also keeps the selected pin in view. */
function Pins({ places, selectedId, onSelect }: Pick<Props, "places" | "selectedId" | "onSelect">) {
  const { t } = useT();
  const clusterRef = useRef<L.MarkerClusterGroup>(null);
  const markers = useRef(new Map<string, L.Marker>());

  // When a place is picked in the list, open its cluster and pan so its pin shows.
  useEffect(() => {
    const marker = selectedId ? markers.current.get(selectedId) : undefined;
    if (marker) clusterRef.current?.zoomToShowLayer(marker);
  }, [selectedId]);

  return (
    <MarkerClusterGroup
      ref={clusterRef}
      chunkedLoading // adds pins a few at a time so slow phones don't freeze
      showCoverageOnHover={false}
      disableClusteringAtZoom={17}
      iconCreateFunction={(cluster: L.MarkerCluster) => clusterIcon(cluster, t)}
    >
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={pinIcon(place.category, place.id === selectedId)}
          // The pin's name for screen readers (and the tooltip on hover).
          title={place.name ?? t(`unnamed.${place.category}`)}
          zIndexOffset={place.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(place.id) }}
          ref={(marker) => {
            if (marker) markers.current.set(place.id, marker);
            else markers.current.delete(place.id);
          }}
        />
      ))}
    </MarkerClusterGroup>
  );
}

/** Gives the map a name for screen readers. */
function MapLabel({ label }: { label: string }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().setAttribute("aria-label", label);
  }, [map, label]);
  return null;
}

/**
 * Moves the map to show the searched area: when the origin changes (new
 * location or typed place), and when a search widens beyond what's on screen.
 */
function FollowSearch({
  origin,
  searchCenter,
  radiusM,
  coverLeft,
  coverBottom,
}: Pick<Props, "origin" | "searchCenter" | "radiusM" | "coverLeft" | "coverBottom">) {
  const map = useMap();
  const lastOrigin = useRef<Origin | null>(null);

  useEffect(() => {
    if (!searchCenter || radiusM <= 0) return;
    const area = L.latLng(searchCenter.lat, searchCenter.lng).toBounds(radiusM * 2);
    const newOrigin = lastOrigin.current !== origin;
    lastOrigin.current = origin;
    if (newOrigin || !map.getBounds().contains(area)) {
      map.fitBounds(area, fitPadding(coverLeft, coverBottom));
    }
  }, [map, origin, searchCenter, radiusM, coverLeft, coverBottom]);

  return null;
}

/**
 * Tells the parent where the map is after the person drags, zooms, or uses
 * the keyboard on it, but not after the app moves the map itself (like
 * zooming to a place picked from the list). That's what decides whether the
 * "Search this area" button shows.
 */
function TrackUserMoves({ onMoved }: { onMoved: (center: LatLng) => void }) {
  const touched = useRef(false);
  const map = useMapEvents({
    moveend: () => {
      if (!touched.current) return;
      touched.current = false;
      const center = map.getCenter();
      onMoved({ lat: center.lat, lng: center.lng });
    },
  });

  useEffect(() => {
    const el = map.getContainer();
    const markTouched = () => (touched.current = true);
    // Clicking a pin is also a pointerdown, but it doesn't move the map, so that's fine.
    const events = ["pointerdown", "wheel", "keydown"] as const;
    events.forEach((name) => el.addEventListener(name, markTouched));
    return () => events.forEach((name) => el.removeEventListener(name, markTouched));
  }, [map]);

  return null;
}
