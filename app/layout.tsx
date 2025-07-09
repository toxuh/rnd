import { type Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "./theme-provider";
import { QCP } from "./query-client-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/components/ui/toast";

const font = Montserrat({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Random Number Generator",
  description: "Generate true random numbers easily.",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className={`${font.className} antialiased`}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QCP>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </QCP>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
