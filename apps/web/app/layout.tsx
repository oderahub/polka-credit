import type { ReactNode } from "react";

export const metadata = {
  title: "PolkaZK Credit",
  description: "Track 2 privacy-aware credit scoring on Polkadot Hub",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

