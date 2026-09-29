import { readFile } from "node:fs/promises";
import path from "node:path";

/** Serves the user guide's screenshots (`docs/user-guide/img/**.png`) to the Documentation page. */
const IMG_DIR = path.join(process.cwd(), "docs", "user-guide", "img");

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  // Only plain file names: no "..", no other file types.
  if (!segments.every((s) => /^[a-z0-9-]+(\.png)?$/.test(s)) || !segments.at(-1)?.endsWith(".png")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const file = await readFile(path.join(IMG_DIR, ...segments));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
