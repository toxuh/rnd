import { type ReactNode } from "react";
import { type Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "./theme-provider";
import { QCP } from "./query-client-provider";

const font = Montserrat({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Random Number Generator",
  description: "Generate true random numbers easily.",
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: Readonly<RootLayoutProps>) => (
  <html lang="en" suppressHydrationWarning>
    <body className={`${font.className} antialiased`}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QCP>{children}</QCP>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
