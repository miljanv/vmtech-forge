import type { Metadata } from "next";
import { Fraunces, Figtree, Geist_Mono } from "next/font/google";
import { RootProviders } from "@/components/admin/root-providers";
import { getEnv } from "@/lib/env";
import "./globals.css";

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StudioForge",
    template: "%s · StudioForge",
  },
  description: "Interni studio za istraživanje, generisanje i prodaju sajtova.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const env = getEnv();
  return (
    <html
      lang="sr-Latn"
      className={`${heading.variable} ${body.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="studio-grain min-h-full bg-background text-foreground">
        <RootProviders clerkEnabled={env.clerkEnabled}>{children}</RootProviders>
      </body>
    </html>
  );
}
