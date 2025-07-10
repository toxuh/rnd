"use client";
import React, { useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { CopyIcon, CheckIcon, SunIcon, MoonIcon } from "lucide-react";
import { SEOHead } from "@/components/seo/seo-head";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useFetchRnd,
  useFetchESP32RawString,
  type RndRequestType,
} from "@/hooks/rnd/useFetchRnd";
import { AuthButton } from "@/components/auth/auth-modal";
import { useAuth } from "@/contexts/auth-context";

const RND_TYPES = [
  "number",
  "boolean",
  "float",
  "choice",
  "string",
  "color",
  "date",
  "uuid",
  "shuffle",
  "weighted",
  "hsl",
  "gradient",
  "password",
  "raw-string",
] as const;

type RndType = RndRequestType;

interface NumberParams {
  min: number;
  max: number;
}

interface FloatParams {
  min?: number;
  max?: number;
}

interface ChoiceParams {
  choices: string[];
}

interface StringParams {
  length: number;
}

interface DateParams {
  from: string;
  to: string;
}

interface WeightedParams {
  items: [unknown, number][];
}

interface ESP32RawStringParams {
  count?: number;
  minLength?: number;
  maxLength?: number;
  apiKey?: string;
}

type RndParams =
  | NumberParams
  | FloatParams
  | ChoiceParams
  | StringParams
  | DateParams
  | WeightedParams
  | ESP32RawStringParams
  | Record<string, never>;

const isValidRndType = (value: string): value is RndType => {
  return RND_TYPES.includes(value as RndType);
};

const formatResult = (result: unknown, type: RndType): ReactNode => {
  const resultStr = String(result);

  switch (type) {
    case "color":
      return (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded border-2 border-gray-300"
            style={{ backgroundColor: resultStr }}
          ></div>
          <span>{resultStr}</span>
        </div>
      );

    case "hsl":
      return (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded border-2 border-gray-300"
            style={{ backgroundColor: resultStr }}
          ></div>
          <span>{resultStr}</span>
        </div>
      );

    case "gradient":
      return (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded border-2 border-gray-300"
            style={{ background: resultStr }}
          ></div>
          <span>{resultStr}</span>
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <span>{resultStr}</span>
        </div>
      );

    case "password":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span>{resultStr}</span>
          </div>
        </div>
      );

    case "raw-string":
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-2">
            Raw ESP32 Hardware String
          </div>
          <div className="font-mono text-sm break-all bg-muted p-2 rounded border max-h-32 overflow-y-auto">
            {resultStr}
          </div>
        </div>
      );

    default:
      return resultStr;
  }
};

const Page = () => {
  const [type, setType] = useState<RndType>("number");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [choices, setChoices] = useState("");
  const [length, setLength] = useState(8);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState("");
  const [copied, setCopied] = useState(false);

  const [rawStringCount, setRawStringCount] = useState(1);
  const [rawStringMinLength, setRawStringMinLength] = useState<
    number | undefined
  >();
  const [rawStringMaxLength, setRawStringMaxLength] = useState<
    number | undefined
  >();
  const [apiKey, setApiKey] = useState("");

  const { mutate, data, isPending, error } = useFetchRnd();
  const {
    mutate: mutateESP32,
    data: esp32Data,
    isPending: esp32Pending,
    error: esp32Error,
  } = useFetchESP32RawString();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const copyToClipboard = async () => {
    let textToCopy = "";

    if (type === "raw-string" && esp32Data) {
      if (esp32Data.rawString) {
        textToCopy = esp32Data.rawString;
      } else if (esp32Data.rawStrings) {
        textToCopy = esp32Data.rawStrings.join("\n");
      }
    } else if (data?.result) {
      textToCopy = String(data.result);
    }

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let params: RndParams = {};

      if (type === "number") {
        params = { min, max } as NumberParams;
      } else if (["choice", "shuffle"].includes(type)) {
        const choiceArray = choices
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (choiceArray.length === 0) {
          alert("Please provide at least one choice");
          return;
        }
        params = { choices: choiceArray } as ChoiceParams;
      } else if (["string", "password"].includes(type)) {
        params = { length } as StringParams;
      } else if (type === "float") {
        params = { min, max } as FloatParams;
      } else if (type === "date") {
        params = { from, to } as DateParams;
      } else if (type === "weighted") {
        try {
          const parsedItems = JSON.parse(items) as [unknown, number][];
          params = { items: parsedItems } as WeightedParams;
        } catch {
          alert("Invalid JSON for items");
          return;
        }
      } else if (type === "raw-string") {
        if (!apiKey.trim()) {
          alert("API key is required for ESP32 raw string access");
          return;
        }

        const esp32Params: ESP32RawStringParams = {
          apiKey: apiKey.trim(),
          count: rawStringCount,
          minLength: rawStringMinLength,
          maxLength: rawStringMaxLength,
        };

        mutateESP32(esp32Params);
        return;
      } else {
        params = {};
      }

      mutate({ type, params });
    } catch (err) {
      console.error(err);
      alert("Error generating random");
    }
  };

  return (
    <>
      <SEOHead
        title="True Random Generator - Hardware-Based Entropy from ESP32 Sensors"
        description="Generate truly random numbers, strings, colors, and data using physical sensor entropy from ESP32 hardware. Unlike pseudo-random algorithms, our system provides cryptographically secure randomness for passwords, tokens, and scientific applications."
        keywords={[
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
          "hardware-based randomness",
        ]}
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "True Random Generator",
          description:
            "Generate truly random numbers, strings, colors, and data using physical sensor entropy from ESP32 hardware",
          url: process.env.NEXT_PUBLIC_APP_URL || "https://rnd.so",
          applicationCategory: "UtilityApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          creator: {
            "@type": "Organization",
            name: "RND Generator Team",
          },
          featureList: [
            "True hardware-based randomness",
            "ESP32 physical sensor entropy",
            "Multiple random data types",
            "API access with authentication",
            "Cryptographically secure generation",
            "Real-time random generation",
          ],
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "127",
          },
        }}
      />

      <main className="min-h-screen bg-background" role="main">
        {/* Navigation Header */}
        <header
          className="absolute top-4 left-4 right-4 flex justify-between items-center z-10"
          role="banner"
        >
          <nav className="flex gap-2">
            <Link href="/about">
              <Button variant="ghost" size="sm">
                About
              </Button>
            </Link>
          </nav>

          <div className="flex gap-2">
            {!isAuthenticated && <AuthButton />}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-screen font-montserrat">
          <div className="max-w-2xl mx-auto grid grid-cols-1 gap-6">
            {/* SEO-optimized heading structure */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                True Random Generator
              </h1>
              <h2 className="text-xl text-muted-foreground mb-2">
                Hardware-Based Entropy from ESP32 Physical Sensors
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Generate cryptographically secure random data using real
                physical fluctuations, not pseudo-random algorithms. Perfect for
                passwords, tokens, scientific research, and security
                applications.
              </p>
            </div>

            <Card
              className="shadow-lg"
              role="region"
              aria-labelledby="generator-title"
            >
              <CardHeader className="text-center">
                <CardTitle id="generator-title" className="text-2xl font-bold">
                  Random Data Generator
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Powered by ESP32 physical sensor entropy
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  className="space-y-4"
                  onSubmit={handleSubmit}
                  role="form"
                  aria-label="Random data generation form"
                >
                  <div>
                    <Label
                      className="text-sm font-medium"
                      htmlFor="random-type"
                    >
                      Random Type
                    </Label>
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        if (isValidRndType(v)) {
                          setType(v);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="random-type"
                        className="w-full capitalize"
                        aria-label="Select random data type"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {RND_TYPES.map((t) => (
                          <SelectItem key={t} className="capitalize" value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {type === "number" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min</Label>
                        <Input
                          type="number"
                          value={min}
                          onChange={(e) => setMin(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Max</Label>
                        <Input
                          type="number"
                          value={max}
                          onChange={(e) => setMax(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {type === "float" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min (optional)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={min}
                          onChange={(e) => setMin(Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Max (optional)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={max}
                          onChange={(e) => setMax(Number(e.target.value))}
                          placeholder="1"
                        />
                      </div>
                    </div>
                  )}

                  {["choice", "shuffle"].includes(type) && (
                    <div>
                      <Label>Choices (comma separated)</Label>
                      <Textarea
                        value={choices}
                        onChange={(e) => setChoices(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {["string", "password"].includes(type) && (
                    <div>
                      <Label>Length</Label>
                      <Input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        required
                      />
                    </div>
                  )}

                  {type === "date" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>From</Label>
                        <Input
                          type="date"
                          value={from}
                          onChange={(e) => setFrom(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>To</Label>
                        <Input
                          type="date"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {type === "weighted" && (
                    <div>
                      <Label>Items (JSON array of [item, weight])</Label>
                      <Textarea
                        value={items}
                        onChange={(e) => setItems(e.target.value)}
                        placeholder='e.g. [["a",1],["b",2]]'
                        required
                      />
                    </div>
                  )}

                  {type === "raw-string" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Premium Feature:</strong> Requires API key
                          with ESP32 raw access permission
                        </p>
                      </div>

                      <div>
                        <Label>API Key *</Label>
                        <Input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your API key"
                          required
                        />
                      </div>

                      <div>
                        <Label>Count (1-10)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={rawStringCount}
                          onChange={(e) =>
                            setRawStringCount(Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min Length (optional)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={rawStringMinLength || ""}
                            onChange={(e) =>
                              setRawStringMinLength(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            placeholder="No minimum"
                          />
                        </div>
                        <div>
                          <Label>Max Length (optional)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={rawStringMaxLength || ""}
                            onChange={(e) =>
                              setRawStringMaxLength(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            placeholder="No maximum"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || esp32Pending}
                  >
                    {isPending || esp32Pending ? "Generating..." : "Generate"}
                  </Button>
                </form>

                {/* Always visible result section */}
                <section
                  className="space-y-2"
                  role="region"
                  aria-labelledby="result-label"
                >
                  <Label
                    id="result-label"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    Generated Result
                    {(data || esp32Data) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="ml-auto h-6 px-2"
                      >
                        {copied ? (
                          <CheckIcon className="h-3 w-3" />
                        ) : (
                          <CopyIcon className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-xs">
                          {copied ? "Copied!" : "Copy"}
                        </span>
                      </Button>
                    )}
                  </Label>
                  <div
                    className="p-4 bg-muted rounded-lg border min-h-[80px] flex items-center transition-all duration-200"
                    role="status"
                    aria-live="polite"
                    aria-label="Random generation result"
                  >
                    {isPending || esp32Pending ? (
                      <div className="flex items-center gap-3 text-muted-foreground w-full justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                        <span className="font-medium">
                          {type === "raw-string"
                            ? "Fetching raw ESP32 data..."
                            : "Generating true randomness..."}
                        </span>
                      </div>
                    ) : error || esp32Error ? (
                      <div className="text-red-600 w-full">
                        <div className="font-medium flex items-center gap-2">
                          Error:
                        </div>
                        <div className="text-sm mt-1 bg-red-50 p-2 rounded border border-red-200">
                          {error?.message || esp32Error?.message}
                        </div>
                      </div>
                    ) : esp32Data ? (
                      <div className="w-full">
                        <div className="space-y-3">
                          {esp32Data.rawString && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Raw ESP32 Hardware String (Length:{" "}
                                {esp32Data.length})
                              </div>
                              <div className="font-mono text-sm break-all bg-background p-3 rounded border max-h-32 overflow-y-auto">
                                {esp32Data.rawString}
                              </div>
                            </div>
                          )}
                          {esp32Data.rawStrings && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Raw ESP32 Hardware Strings ({esp32Data.count} of{" "}
                                {esp32Data.requestedCount} requested)
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {esp32Data.rawStrings.map((str, index) => (
                                  <div
                                    key={index}
                                    className="font-mono text-sm break-all bg-background p-2 rounded border"
                                  >
                                    <div className="text-xs text-muted-foreground mb-1">
                                      String {index + 1} (Length: {str.length})
                                    </div>
                                    {str}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Source: {esp32Data.source} • Generated:{" "}
                            {new Date(esp32Data.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ) : data ? (
                      <div className="w-full">
                        <div className="font-mono text-lg break-all p-2 bg-background rounded border">
                          {formatResult(data.result, type)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic w-full text-center py-4">
                        <div>
                          Click &quot;Generate&quot; to create truly random data
                        </div>
                        <div className="text-xs mt-1">
                          Powered by ESP32 physical sensors
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
};

export default Page;
