"use client";
import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  CopyIcon,
  CheckIcon,
  GithubIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react";

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
import { useFetchRnd, type RndRequestType } from "@/hooks/rnd/useFetchRnd";
import { AuthButton } from "@/components/auth/auth-modal";

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

type RndParams =
  | NumberParams
  | FloatParams
  | ChoiceParams
  | StringParams
  | DateParams
  | WeightedParams
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

  const { mutate, data, isPending, error } = useFetchRnd();
  const { theme, setTheme } = useTheme();

  const copyToClipboard = async () => {
    if (!data?.result) return;

    try {
      await navigator.clipboard.writeText(String(data.result));
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
    <main className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <AuthButton />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
        >
          {theme === "dark" ? (
            <SunIcon className="h-4 w-4" />
          ) : (
            <MoonIcon className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" size="icon" asChild className="h-9 w-9">
          <Link
            href="https://github.com/toxuh/rnd"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="min-h-screen p-4 font-montserrat">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 py-8">
          {/* Random Generator */}
          <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              True Random Generator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Powered by physical sensor entropy
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label className="text-sm font-medium">Random Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    if (isValidRndType(v)) {
                      setType(v);
                    }
                  }}
                >
                  <SelectTrigger className="w-full capitalize">
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Generating..." : "Generate"}
              </Button>
            </form>

            {/* Always visible result section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                Result
                {data && (
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
              <div className="p-4 bg-muted rounded-lg border min-h-[80px] flex items-center transition-all duration-200">
                {isPending ? (
                  <div className="flex items-center gap-3 text-muted-foreground w-full justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                    <span className="font-medium">
                      Generating true randomness...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-red-600 w-full">
                    <div className="font-medium flex items-center gap-2">
                      Error:
                    </div>
                    <div className="text-sm mt-1 bg-red-50 p-2 rounded border border-red-200">
                      {error.message}
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
            </div>
          </CardContent>
        </Card>

        {/* User Dashboard Link */}
        <div className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Want to manage API keys and view analytics?
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </main>
  );
};

export default Page;
