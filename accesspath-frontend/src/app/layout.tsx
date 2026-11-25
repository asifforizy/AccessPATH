
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { GoogleProvider } from "@/provider/google-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Footer } from "@/components/shared/footer";
import { AuthUser } from "@/provider/auth-user";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AccessPath",
  description:
    "Discover accessible places and barrier-free routes with AccessPath.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <GoogleProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <AuthUser />
            </Suspense>

            {children}

            <Footer />

            <Toaster position="top-right" />
          </GoogleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
