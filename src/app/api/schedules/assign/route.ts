/**
 * Proxy POST /api/schedules/assign to Laravel so the request body is forwarded.
 * Next.js rewrites can fail to forward POST bodies; this route ensures the payload reaches the backend.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  const url = `${BACKEND_URL.replace(/\/$/, "")}/schedules/assign`;
  const auth = request.headers.get("Authorization");

  try {
    const body = await request.json();
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
