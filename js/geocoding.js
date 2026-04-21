// js/geocoding.js
// OpenRouteService (Pelias) geocoder — free tier, no credit card.
// Docs: https://openrouteservice.org/dev/#/api-docs/geocode

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjJkNWNiMzMwZTBjNTRlNWRiNTA5YzI2MmY3ZmI5MWM2IiwiaCI6Im11cm11cjY0In0=";
const ORS_URL = "https://api.openrouteservice.org/geocode/search";

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
    const url =
      `${ORS_URL}` +
      `?api_key=${ORS_API_KEY}` +
      `&text=${encodeURIComponent(address)}` +
      `&size=1` +
      `&boundary.country=CA`; // bias toward Canada; remove this line to search globally

    const res = await fetch(url);

    if (!res.ok) {
      console.error("[geocode] HTTP error:", res.status);
      return null;
    }

    const data = await res.json();
    if (!data.features || data.features.length === 0) {
      console.warn("[geocode] no results for:", address);
      return null;
    }

    const hit = data.features[0];
    const [lng, lat] = hit.geometry.coordinates;
    const props = hit.properties || {};

    const result = {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      formatted: props.label || address,
      city: props.locality || props.county || props.region || "",
      country: props.country || ""
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
