import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNS Lens",
  description: "Real-time DNS propagation checker with live streaming and timeline tracking.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }]
  }
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
