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
