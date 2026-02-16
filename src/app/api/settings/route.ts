/**
 * Proxy GET and PUT /api/settings to Laravel.
 * - GET: load settings (any authenticated user).
 * - PUT: save settings (body must be forwarded; rewrites often drop it).
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function GET(request: Request) {
  const url = `${BACKEND_URL.replace(/\/$/, "")}/settings`;
  const auth = request.headers.get("Authorization");

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
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

export async function PUT(request: Request) {
  const url = `${BACKEND_URL.replace(/\/$/, "")}/settings`;
  const auth = request.headers.get("Authorization");

  try {
    const body = await request.json();
    const res = await fetch(url, {
      method: "PUT",
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
