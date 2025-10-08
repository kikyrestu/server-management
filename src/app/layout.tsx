import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infrastructure Management System",
  description: "Secure infrastructure management with PAM authentication",
  keywords: ["Infrastructure", "Management", "PAM", "Authentication", "Server", "VM", "Monitoring"],
  authors: [{ name: "System Admin" }],
  openGraph: {
    title: "Infrastructure Management System",
    description: "Secure infrastructure management with PAM authentication",
    url: "https://localhost:3000",
    siteName: "InfraManager",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Infrastructure Management System",
    description: "Secure infrastructure management with PAM authentication",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
