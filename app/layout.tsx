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
  title: {
    default: "True Random Generator - Hardware-Based Entropy from ESP32 Sensors",
    template: "%s | True Random Generator"
  },
  description: "Generate truly random numbers, strings, colors, and data using physical sensor entropy from ESP32 hardware. Unlike pseudo-random algorithms, our system provides cryptographically secure randomness for passwords, tokens, and scientific applications.",
  keywords: [
    "true random generator",
    "hardware random number generator",
    "ESP32 random",
    "physical entropy",
    "cryptographic randomness",
    "secure random generator",
    "random password generator",
    "random string generator",
    "random color generator",
    "scientific randomness",
    "quantum randomness",
    "hardware-based randomness"
  ],
  authors: [{ name: "RND Generator Team" }],
  creator: "RND Generator",
  publisher: "RND Generator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://rnd.so'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'True Random Generator - Hardware-Based Entropy from ESP32 Sensors',
    description: 'Generate truly random numbers, strings, colors, and data using physical sensor entropy from ESP32 hardware. Cryptographically secure randomness for passwords, tokens, and scientific applications.',
    siteName: 'True Random Generator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'True Random Generator - Hardware-Based Entropy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'True Random Generator - Hardware-Based Entropy from ESP32 Sensors',
    description: 'Generate truly random numbers, strings, colors, and data using physical sensor entropy from ESP32 hardware.',
    images: ['/og-image.png'],
    creator: '@rndgenerator',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "True Random Generator",
            "description": "Generate truly random numbers, strings, colors, and data using physical sensor entropy from ESP32 hardware",
            "url": process.env.NEXT_PUBLIC_APP_URL || "https://rnd.so",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "creator": {
              "@type": "Organization",
              "name": "RND Generator Team"
            },
            "featureList": [
              "True hardware-based randomness",
              "ESP32 physical sensor entropy",
              "Multiple random data types",
              "API access with authentication",
              "Cryptographically secure generation",
              "Real-time random generation"
            ]
          })
        }}
      />
    </head>
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
