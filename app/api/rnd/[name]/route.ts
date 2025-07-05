"use server";
import { NextRequest, NextResponse } from "next/server";

import * as rnd from "@/services/rnd.service";

export const POST = async (req: NextRequest) => {
  try {
    const { min, max, choices, length, from, to, items } = await req.json();
    const name = req.nextUrl.pathname.split("/").pop();
    let result: unknown;

    switch (name) {
      case "number":
        if (typeof min !== "number" || typeof max !== "number") {
          return NextResponse.json(
            { error: "min and max must be numbers for number generation" },
            { status: 400 }
          );
        }
        result = await rnd.randomNumber(min, max);
        break;

      case "boolean":
        result = await rnd.randomBoolean();
        break;

      case "float":
        result = await rnd.randomFloat(min, max);
        break;

      case "choice":
        if (!Array.isArray(choices) || choices.length === 0) {
          return NextResponse.json(
            { error: "choices must be a non-empty array" },
            { status: 400 }
          );
        }
        result = await rnd.randomChoice(choices);
        break;

      case "string":
        if (typeof length !== "number" || length < 0) {
          return NextResponse.json(
            { error: "length must be a non-negative number" },
            { status: 400 }
          );
        }
        result = await rnd.randomString(length);
        break;

      case "color":
        result = await rnd.randomHexColor();
        break;

      case "date":
        if (!from || !to) {
          return NextResponse.json(
            { error: "from and to dates are required" },
            { status: 400 }
          );
        }
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid date format" },
            { status: 400 }
          );
        }
        const dateResult = await rnd.randomDate(fromDate, toDate);
        result = dateResult.toISOString();
        break;

      case "uuid":
        result = await rnd.randomUUIDv4();
        break;

      case "shuffle":
        if (!Array.isArray(choices) || choices.length === 0) {
          return NextResponse.json(
            { error: "choices must be a non-empty array for shuffle" },
            { status: 400 }
          );
        }
        result = await rnd.shuffle(choices);
        break;

      case "weighted":
        if (!Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            { error: "items must be a non-empty array of [value, weight] pairs" },
            { status: 400 }
          );
        }
        // Validate that items are in the correct format
        const isValidWeightedItems = items.every(
          (item) => Array.isArray(item) && item.length === 2 && typeof item[1] === "number"
        );
        if (!isValidWeightedItems) {
          return NextResponse.json(
            { error: "items must be an array of [value, weight] pairs where weight is a number" },
            { status: 400 }
          );
        }
        result = await rnd.weightedChoice(items);
        break;

      case "hsl":
        result = await rnd.randomHslColor();
        break;

      case "gradient":
        result = await rnd.randomGradient();
        break;

      case "password":
        if (typeof length !== "number" || length < 0) {
          return NextResponse.json(
            { error: "length must be a non-negative number for password generation" },
            { status: 400 }
          );
        }
        result = await rnd.randomPassword(length);
        break;

      default:
        return NextResponse.json({ error: "Unknown rnd type" }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in RND API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
