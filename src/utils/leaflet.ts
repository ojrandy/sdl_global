import type L from 'leaflet';

// Tears down a Leaflet map safely, even while a zoom animation is still running.
//
// Leaflet 1.9.4 finishes every animated zoom from a fixed 250 ms setTimeout
// (_animateZoom -> _onZoomTransitionEnd). map.remove() deletes the panes but leaves that
// timer and the _animatingZoom flag in place, so leaving a page mid-zoom (zoom buttons,
// flyTo, fitBounds) made the timer fire against a destroyed map and throw
// "Cannot read properties of undefined (reading '_leaflet_pos')". Clearing the flag first
// makes the late callback return straight away.
export function destroyMap(map: L.Map) {
  (map as unknown as { _animatingZoom: boolean })._animatingZoom = false;
  map.remove();
}

// Fits a world-scale map to `bounds` without showing the grey void above the Arctic or
// below the Antarctic: the minimum zoom is raised until the tiles fill the map height,
// and panning is held inside the tiled latitudes (longitude stays free to wrap).
export function fitWorldView(map: L.Map, bounds: L.LatLngBounds) {
  const snap = map.options.zoomSnap || 1;
  const fillZoom = Math.ceil(Math.log2(map.getSize().y / 256) / snap) * snap;
  map.setMinZoom(Math.max(0, fillZoom));
  map.setMaxBounds([[-85, -100000], [85, 100000]]);
  map.options.maxBoundsViscosity = 1;
  map.fitBounds(bounds, { padding: [24, 24] });
}
