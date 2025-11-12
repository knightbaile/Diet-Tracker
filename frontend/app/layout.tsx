import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FHE Diet Tracker",
  description: "Privacy-preserving diet tracking system using Zama FHEVM",
  viewport: "width=device-width, initial-scale=1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

