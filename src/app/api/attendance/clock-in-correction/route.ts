/**
 * Proxy POST /api/attendance/clock-in-correction to Laravel.
 * Next.js rewrites can fail to forward large POST bodies (e.g. base64 images).
 * This route ensures the full payload (photo, reason) reaches the backend.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");

  try {
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ message: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = `${BACKEND_URL.replace(/\/$/, "")}/attendance/clock-in-correction`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "application/json");

    return new Response(text, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: err instanceof Error ? err.message : "Proxy request failed",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
