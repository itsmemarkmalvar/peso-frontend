/**
 * Proxy POST /api/approvals/reject to Laravel so the request body is forwarded.
 * Next.js rewrites can fail to forward POST bodies; this route ensures the rejection reason reaches the backend.
 * Body: { id: number, reason: string }
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  const auth = request.headers.get("Authorization");

  try {
    const body = await request.json();
    const id = body?.id;
    if (id == null) {
      return new Response(
        JSON.stringify({ message: "Missing id in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const url = `${BACKEND_URL.replace(/\/$/, "")}/approvals/${id}/reject`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({ reason: body.reason }),
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
