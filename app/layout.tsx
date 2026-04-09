import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { AgentsProvider } from "@/contexts/agents-context";
import { AgentsActivityProvider } from "@/contexts/agents-activity-context";
import { ProjectsProvider } from "@/contexts/projects-context";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

const BASE_URL = "https://www.santarai.com"

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SantarAI — Plateforme de Virtualisation d'Entreprise par IA",
    template: "%s | SantarAI",
  },
  description:
    "Ne gérez plus des employés. Orchestrez des Intelligences. Déployez une force de travail IA infinie, disponible 24/7 — GHOST, MECHA, DAIMYO et 28 salariés IA spécialisés.",
  keywords: [
    "SantarAI",
    "agents IA",
    "virtualisation entreprise",
    "salariés IA",
    "automatisation",
    "intelligence artificielle",
    "productivité",
    "GPT-4",
    "plateforme IA",
  ],
  authors: [{ name: "SantarAI Systems" }],
  creator: "SantarAI Systems",
  publisher: "SantarAI Systems",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "SantarAI",
    title: "SantarAI — La première plateforme de virtualisation d'entreprise",
    description:
      "Orchestrez une force de travail IA infinie. 28 salariés spécialisés, disponibles 24/7.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SantarAI — Plateforme d'agents IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SantarAI — Plateforme de Virtualisation d'Entreprise",
    description: "Orchestrez une force de travail IA infinie. 28 salariés spécialisés, 24/7.",
    images: ["/og-image.png"],
    creator: "@santarai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo-v2.png", type: "image/png" },
    ],
    apple: "/logo-v2.png",
    shortcut: "/logo-v2.png",
  },
  manifest: "/manifest.json",
}

function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
`,
      }}
    />
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`font-sans antialiased ${inter.className}`}>
        <ServiceWorkerRegistration />
        <LanguageProvider>
          <AuthProvider>
            <AgentsProvider>
              <AgentsActivityProvider>
                <ProjectsProvider>
                  {children}
                </ProjectsProvider>
              </AgentsActivityProvider>
            </AgentsProvider>
          </AuthProvider>
        </LanguageProvider>
        <Toaster theme="dark" position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
