import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { type ReactNode, Suspense } from "react";
import "./globals.css";
import { Toaster } from "sonner";
import { Footer } from "@/components/shared/footer";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AuthUser } from "@/provider/auth-user";
import { GoogleProvider } from "@/provider/google-provider";

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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">
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
