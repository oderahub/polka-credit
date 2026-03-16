import { NextResponse } from "next/server";
import { issueSnapshotCertificate } from "../../../lib/governance-snapshot";

export const runtime = "nodejs";

type CertificateRequest = {
  address?: string;
  verifierAddress?: string;
  chainId?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CertificateRequest;

  try {
    const certificate = await issueSnapshotCertificate(
      body.address ?? "",
      body.verifierAddress ?? "",
      body.chainId ?? 420420417
    );
    return NextResponse.json(certificate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Certificate issuance failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
