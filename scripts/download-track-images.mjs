import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

// Reproduce the locally stored course images from the checked-in source manifest.
// Existing assets are preserved; remove a specific asset manually to re-download it.
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(path.join(root, "data/track-catalog.json"), "utf8"));
const output = path.join(root, "public/images/tracks");
await mkdir(output, { recursive: true });

for (const track of catalog) {
  const filename = path.join(output, `${track.slug}.webp`);
  try {
    await access(filename);
    console.log(`Exists: ${track.slug}`);
    continue;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const response = await fetch(track.imageUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${track.name}: image request failed (${response.status})`);
  if (!response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error(`${track.name}: source did not return an image`);
  }
  const source = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(source).metadata();
  if (metadata.width !== track.width || metadata.height !== track.height) {
    throw new Error(`${track.name}: source dimensions changed; review the manifest first`);
  }
  const image = await sharp(source).webp({ quality: 88 }).toBuffer();
  await writeFile(filename, image, { flag: "wx" });
  console.log(`Downloaded: ${track.slug} (${image.length} bytes)`);
}
