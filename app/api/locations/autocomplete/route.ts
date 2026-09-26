import { NextResponse } from "next/server";

/**
 * Location autocomplete via OpenStreetMap's free Nominatim API — no paid
 * Google Places key needed (leadgen.md is explicit that lead data itself
 * never touches a paid Places API; this extends the same principle to the
 * location input's autocomplete). Nominatim's usage policy caps this at
 * ~1 req/sec — the client debounces before calling this route.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", query);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("addressdetails", "1");
  nominatimUrl.searchParams.set("accept-language", "en");
  nominatimUrl.searchParams.set("limit", "6");

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        // Nominatim's usage policy requires an identifying User-Agent.
        "User-Agent": "LocalLeadsAI/1.0 (contact: support@localleads.ai)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = (await response.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return NextResponse.json({
      results: data.map((place) => ({
        id: place.place_id,
        label: place.display_name,
        lat: Number(place.lat),
        lon: Number(place.lon),
      })),
    });
  } catch (error) {
    console.error("Location autocomplete failed:", error);
    return NextResponse.json({ results: [] });
  }
}
