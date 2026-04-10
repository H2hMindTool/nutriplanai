import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#9ACD32",
};

export const metadata: Metadata = {
  title: "NutriPlanAI — Seu Plano Alimentar com IA",
  description: "Gere um plano alimentar personalizado com Inteligência Artificial em segundos. Calculado com base no seu perfil, objetivos e preferências.",
  keywords: "dieta low carb, plano alimentar, inteligência artificial, emagrecimento, nutrição",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
