import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SantarAI : La première plateforme de virtualisation d'entreprise",
  description: "Ne gérez plus des employés. Orchestrez des Intelligences. Déployez une force de travail infinie, disponible 24/7.",
  keywords: ["SantarAI", "virtualisation entreprise", "IA", "agents intelligents", "productivité"],
  openGraph: {
    title: "SantarAI : La première plateforme de virtualisation d'entreprise",
    description: "Ne gérez plus des employés. Orchestrez des Intelligences. Déployez une force de travail infinie, disponible 24/7.",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`font-sans antialiased ${inter.className}`}>
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
