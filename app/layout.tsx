import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Everdeck — Find your market. Effortlessly.",
  description:
    "Everdeck studies the market and hands you scored business ideas every day, mapped out and ready to build.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/bb5de19d87c09a95216dc6ccd96e37c6?family=Nimbus+Sans+TW01"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
