import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { localStorageEnabled, localStorageRoot } from "@/lib/shortcut-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const match = /^[a-f0-9-]+\.(png|jpeg|webp|gif|mp4|webm|ogg)$/.exec(name);
  if (!localStorageEnabled() || !match) return new Response(null, { status: 404 });
  try {
    const data = await readFile(path.join(localStorageRoot, "media", name));
    const headers = new Headers({ "Content-Type": `${["png", "jpeg", "webp", "gif"].includes(match[1]) ? "image" : "video"}/${match[1]}`, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes" });
    const range = request.headers.get("range");
    if (range) {
      const parts = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = parts?.[1] ? Number(parts[1]) : Math.max(0, data.length - Number(parts?.[2]));
      const end = parts?.[1] && parts[2] ? Math.min(Number(parts[2]), data.length - 1) : data.length - 1;
      if (!parts || (!parts[1] && !parts[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= data.length) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.length}` } });
      headers.set("Content-Range", `bytes ${start}-${end}/${data.length}`);
      headers.set("Content-Length", String(end - start + 1));
      return new Response(new Uint8Array(data.subarray(start, end + 1)), { status: 206, headers });
    }
    headers.set("Content-Length", String(data.length));
    return new Response(new Uint8Array(data), { headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    console.error("Local media read failed", error);
    return new Response(null, { status: 500 });
  }
}
