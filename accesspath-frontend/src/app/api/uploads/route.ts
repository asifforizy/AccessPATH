import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Local image upload endpoint.
 *
 * Stores files under `public/uploads` and returns a public URL that the existing
 * metadata endpoints (location photos, report attachments) accept.
 * For serverless hosting swap this for S3/Cloudinary — the client contract
 * (`{ success, url }`) stays the same.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: NextRequest) {
  if (!request.cookies.get("accessToken")?.value) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "No image file provided" },
      { status: 400 },
    );
  }

  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json(
      {
        success: false,
        message: "Only JPEG, PNG, WebP or GIF images are allowed",
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { success: false, message: "Image must be 8 MB or smaller" },
      { status: 413 },
    );
  }

  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  await writeFile(
    path.join(directory, fileName),
    Buffer.from(await file.arrayBuffer()),
  );

  return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
}
