import { NextResponse } from "next/server";
import { resolveGovernanceEligibility } from "../../../lib/governance-snapshot";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? "";

  return NextResponse.json(resolveGovernanceEligibility(address));
}
