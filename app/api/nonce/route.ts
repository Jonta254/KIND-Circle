import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const nonce = crypto.randomUUID().replace(/-/g, "");

  // Save nonce in secure cookie
  cookies().set("siwe", nonce, { secure: true, httpOnly: true, path: "/" });

  return NextResponse.json({ nonce });
}
