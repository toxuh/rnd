import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

export function SEOHead({
  title = "True Random Generator - Hardware-Based Entropy from ESP32 Sensors",
  description = "Generate truly random numbers, strings, colors, and data using physical sensor entropy from ESP32 hardware. Unlike pseudo-random algorithms, our system provides cryptographically secure randomness.",
  keywords = [
    "true random generator",
    "hardware random number generator", 
    "ESP32 random",
    "physical entropy",
    "cryptographic randomness"
  ],
  canonical,
  ogImage = "/og-image.png",
  ogType = "website",
  noIndex = false,
  structuredData
}: SEOHeadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rnd.so';
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="True Random Generator - Hardware-Based Entropy" />
      <meta property="og:site_name" content="True Random Generator" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:creator" content="@rndgenerator" />
      <meta name="twitter:site" content="@rndgenerator" />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="RND Generator Team" />
      <meta name="generator" content="Next.js" />
      <meta name="application-name" content="True Random Generator" />
      <meta name="apple-mobile-web-app-title" content="RND Generator" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" content="#000000" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
    </Head>
  );
}
