"use client";
import React from "react";
import { SEOHead } from "@/components/seo/seo-head";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheckIcon, 
  CpuIcon, 
  BeakerIcon, 
  PaletteIcon,
  ZapIcon,
  GlobeIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from "lucide-react";
import Link from "next/link";

const AboutPage = () => {
  const features = [
    {
      icon: <CpuIcon className="h-6 w-6" />,
      title: "ESP32 Hardware Entropy",
      description: "Physical sensor fluctuations generate true randomness, not mathematical algorithms"
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      title: "Cryptographically Secure",
      description: "Suitable for passwords, tokens, encryption keys, and security-critical applications"
    },
    {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Scientific Grade",
      description: "Unbiased random data perfect for research, statistics, and Monte Carlo simulations"
    },
    {
      icon: <ZapIcon className="h-6 w-6" />,
      title: "Real-Time Generation",
      description: "Sub-second response times with live hardware entropy collection"
    },
    {
      icon: <GlobeIcon className="h-6 w-6" />,
      title: "Developer API",
      description: "RESTful API with authentication, rate limiting, and comprehensive documentation"
    },
    {
      icon: <PaletteIcon className="h-6 w-6" />,
      title: "13+ Data Types",
      description: "Numbers, strings, colors, dates, UUIDs, passwords, and raw hardware data"
    }
  ];

  return (
    <>
      <SEOHead
        title="About True Random Generator - Why Hardware Entropy Matters"
        description="Discover why our ESP32 hardware-based random generator is superior to pseudo-random algorithms. Learn about true randomness, cryptographic security, and real-world applications."
        keywords={[
          "true random generator",
          "hardware entropy",
          "ESP32 randomness",
          "cryptographic security",
          "physical randomness",
          "quantum randomness",
          "random number generator comparison"
        ]}
        canonical="/about"
      />
      
      <main className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back to Generator
            </Button>
          </Link>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Hardware-Powered Randomness
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              What Makes This the <span className="text-primary">Best</span> True Random Generator?
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Unlike pseudo-random algorithms that can be predicted, our system uses physical sensor fluctuations 
              from ESP32 hardware to generate genuinely unpredictable, cryptographically secure random data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto">
                  Try Generator Now
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Get API Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why True Randomness Matters */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why True Randomness Matters</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The difference between pseudo-random and true random isn't just technical—it's fundamental to security, 
                science, and fairness in digital systems.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-red-700">❌ Pseudo-Random (Traditional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-red-600">• Mathematical algorithms with predictable patterns</p>
                  <p className="text-sm text-red-600">• Can be reverse-engineered if seed is known</p>
                  <p className="text-sm text-red-600">• Reproducible sequences (same input = same output)</p>
                  <p className="text-sm text-red-600">• Vulnerable to cryptographic attacks</p>
                  <p className="text-sm text-red-600">• Limited entropy sources</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-green-700">✅ True Random (Our System)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-green-600">• Physical sensor fluctuations and quantum effects</p>
                  <p className="text-sm text-green-600">• Impossible to predict or reverse-engineer</p>
                  <p className="text-sm text-green-600">• Non-reproducible, genuinely unique sequences</p>
                  <p className="text-sm text-green-600">• Cryptographically secure for all applications</p>
                  <p className="text-sm text-green-600">• Unlimited natural entropy from environment</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Unmatched Features & Capabilities</h2>
              <p className="text-lg text-muted-foreground">
                Built for professionals who demand the highest quality randomness
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Superiority */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Technical Superiority</h2>
              <p className="text-lg text-muted-foreground">
                Why our ESP32-based system outperforms all alternatives
              </p>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CpuIcon className="h-5 w-5" />
                    Physical Entropy Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Hardware Components:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Temperature sensor fluctuations</li>
                        <li>• Electrical noise measurements</li>
                        <li>• Analog-to-digital conversion variations</li>
                        <li>• Environmental electromagnetic interference</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Quantum Effects:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Thermal noise in semiconductors</li>
                        <li>• Shot noise in electronic components</li>
                        <li>• Quantum tunneling effects</li>
                        <li>• Brownian motion in sensors</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{"< 500ms"}</div>
                      <div className="text-sm text-muted-foreground">Average Response Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">99.9%</div>
                      <div className="text-sm text-muted-foreground">Uptime Guarantee</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">13+</div>
                      <div className="text-sm text-muted-foreground">Random Data Types</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Experience True Randomness?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of developers, researchers, and security professionals who trust 
              our hardware-based random generation for their most critical applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Start Generating Now
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Get API Access
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutPage;
