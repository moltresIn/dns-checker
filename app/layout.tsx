import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlasmaBackground } from "@/components/background/PlasmaBackground";
import { Box } from "@/components/animate-ui/components/layout/box";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PlasmaBackground />
        <Box className="relative z-10">{children}</Box>
      </body>
    </html>
  );
}
