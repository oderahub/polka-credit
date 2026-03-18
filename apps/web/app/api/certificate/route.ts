import { NextResponse } from "next/server";
import { issueSnapshotCertificate } from "../../../lib/governance-snapshot";

export const runtime = "nodejs";

type CertificateRequest = {
  address?: string;
  verifierAddress?: string;
  chainId?: number;
};

type JsonIssuedCertificate = {
  claimant: `0x${string}`;
  proof: `0x${string}`;
  publicInputs: `0x${string}`;
  context: `0x${string}`;
  tier: 0 | 1 | 2 | 3;
  deadline: string;
  datasetId: `0x${string}`;
  source: string;
  issuedBy: `0x${string}`;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CertificateRequest;

  try {
    const certificate = await issueSnapshotCertificate(
      body.address ?? "",
      body.verifierAddress ?? "",
      body.chainId ?? 420420417
    );
    const responseBody: JsonIssuedCertificate = {
      ...certificate,
      deadline: certificate.deadline.toString(),
    };
    return NextResponse.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Certificate issuance failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
