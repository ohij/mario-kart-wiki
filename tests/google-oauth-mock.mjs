// Explicit test-process preload. Production code never imports this file or reads these variables.
// Only Google HTTP transport is mocked; the callback still verifies actual RSA JWT signatures.
const originalFetch = globalThis.fetch;
const usedCodes = new Set();
globalThis.fetch = async (resource, options) => {
  const url = typeof resource === "string" ? resource : resource instanceof URL ? resource.href : resource.url;
  if (url === "https://www.googleapis.com/oauth2/v3/certs") return Response.json(JSON.parse(process.env.TEST_GOOGLE_JWKS));
  if (url === "https://oauth2.googleapis.com/token") {
    const body = new URLSearchParams(options.body);
    const code = body.get("code");
    if (!body.get("code_verifier") || body.get("client_secret") !== process.env.GOOGLE_CLIENT_SECRET || usedCodes.has(code)) return Response.json({ error: "invalid_grant" }, { status: 400 });
    usedCodes.add(code);
    return Response.json({ id_token: code });
  }
  return originalFetch(resource, options);
};
