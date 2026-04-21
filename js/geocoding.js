// js/geocoding.js
// Nominatim (OpenStreetMap) geocoder — no API key needed.
// Usage policy: max 1 request/sec, include a descriptive User-Agent via Referer.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// In-memory + localStorage cache so we don't re-geocode the same address
const geocodeCache = JSON.parse(localStorage.getItem("geocodeCache") || "{}");

async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;

  const key = address.trim().toLowerCase();
  if (geocodeCache[key]) {
    console.log("[geocode] cache hit:", address);
    return geocodeCache[key];
  }

  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      console.error("[geocode] HTTP error:", res.status);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("[geocode] no results for:", address);
      return null;
    }

    const hit = data[0];
    const result = {
      lat: parseFloat(parseFloat(hit.lat).toFixed(6)),
      lng: parseFloat(parseFloat(hit.lon).toFixed(6)),
      formatted: hit.display_name || address,
      city:
        hit.address?.city ||
        hit.address?.town ||
        hit.address?.village ||
        hit.address?.municipality ||
        "",
      country: hit.address?.country || ""
    };

    geocodeCache[key] = result;
    localStorage.setItem("geocodeCache", JSON.stringify(geocodeCache));
    return result;
  } catch (err) {
    console.error("[geocode] fetch error:", err);
    return null;
  }
}

// Expose globally so non-module pages can call it
window.geocodeAddress = geocodeAddress;
