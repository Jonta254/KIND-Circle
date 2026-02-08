import { NextResponse } from "next/server";
import { verifyCloudProof, ISuccessResult } from "@worldcoin/minikit-js";

export async function POST(req: Request) {
  try {
    const { payload, action, signal } = await req.json();

    const app_id = process.env.APP_ID; // Your app ID, e.g. 'app_xxxxx'

    const verifyRes = await verifyCloudProof(payload as ISuccessResult, app_id, action, signal);

    if (verifyRes.success) {
      // Verification success - do backend logic here (e.g. mark user verified)
      return NextResponse.json({ status: 200, verifyRes });
    } else {
      // Verification failed
      return NextResponse.json({ status: 400, verifyRes });
    }
  } catch (error) {
    return NextResponse.json({ status: 500, error: (error as Error).message });
  }
}
