async function sign(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const drink = typeof body.drink === "string" ? body.drink : "";
  const book = typeof body.book === "string" ? body.book : "";
  const okDrink = drink === (env.LOGIN_DRINK || "").trim().toLowerCase();
  const okBook = book === (env.LOGIN_BOOK || "").trim().toLowerCase();

  if (!okDrink || !okBook) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const token = await sign(`${expires}`, env.SESSION_SECRET);
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    `session=${expires}.${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
