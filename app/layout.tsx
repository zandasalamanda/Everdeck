import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

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
      <body>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#C9BBFF",
              colorBackground: "#141417",
              colorText: "#F5F5F6",
              colorTextSecondary: "#9a9aa2",
              borderRadius: "0.9rem",
              fontFamily: "'Nimbus Sans TW01', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            },
            elements: {
              card: "bg-carbon-panel ring-1 ring-white/10 shadow-lift",
              headerTitle: "text-cloud",
              socialButtonsBlockButton: "bg-white/[0.06] border border-white/10 text-cloud hover:bg-white/[0.1]",
              formButtonPrimary: "bg-iridescent text-ink hover:opacity-90 normal-case",
              footerActionLink: "text-lilac hover:text-sky",
            },
          }}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
