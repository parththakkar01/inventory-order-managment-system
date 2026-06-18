import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Reseptionist",
  description: "inventory and order management system"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
