'use client'

import { useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import MobileNav from "./components/MobileNav";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Pages that DON'T have the standard nav ecosystem
  const isPublicPage = ['/login', '/register', '/', '/onboarding', '/acesso-negado'].includes(pathname);

  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#9ACD32" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        {!isPublicPage && (
          <>
            <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </>
        )}
        
        <main className={!isPublicPage ? "app-main-layout" : ""}>
          {children}
        </main>

        <MobileNav />
      </body>
    </html>
  );
}
