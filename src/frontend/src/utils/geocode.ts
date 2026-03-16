export interface GeoLocation {
  lat: number;
  lon: number;
  displayName: string;
  timezone: string; // IANA timezone identifier e.g. "Europe/Helsinki"
}

export async function geocodePlace(placeName: string): Promise<GeoLocation> {
  const encoded = encodeURIComponent(placeName);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "SunriseSunsetTrendTool/1.0",
    },
  });
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);
  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error(`Place not found: "${placeName}"`);
  }
  const lat = Number.parseFloat(data[0].lat);
  const lon = Number.parseFloat(data[0].lon);

  // Resolve IANA timezone for the coordinate
  const tzRes = await fetch(
    `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`,
  );
  let timezone = "UTC";
  if (tzRes.ok) {
    const tzData = await tzRes.json();
    if (tzData?.timeZone) timezone = tzData.timeZone;
  }

  return {
    lat,
    lon,
    displayName: data[0].display_name,
    timezone,
  };
}
