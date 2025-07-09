/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "../route";

// Mock the rnd service
jest.mock("@/services/rnd.service", () => ({
  randomNumber: jest.fn().mockResolvedValue(42),
  randomBoolean: jest.fn().mockResolvedValue(true),
  randomFloat: jest.fn().mockResolvedValue(0.5),
  randomChoice: jest.fn().mockResolvedValue("choice1"),
  randomString: jest.fn().mockResolvedValue("randomstring"),
  randomHexColor: jest.fn().mockResolvedValue("#ff0000"),
  randomDate: jest.fn().mockResolvedValue(new Date("2023-01-01")),
  randomUUIDv4: jest.fn().mockResolvedValue("123e4567-e89b-12d3-a456-426614174000"),
  shuffle: jest.fn().mockResolvedValue(["b", "a", "c"]),
  weightedChoice: jest.fn().mockResolvedValue("weighted1"),
  randomHslColor: jest.fn().mockResolvedValue("hsl(180, 50%, 50%)"),
  randomGradient: jest.fn().mockResolvedValue("linear-gradient(#ff0000, #00ff00)"),
  randomPassword: jest.fn().mockResolvedValue("P@ssw0rd123"),
}));

// Mock security middleware
jest.mock("@/lib/security-middleware", () => ({
  securityMiddleware: {
    validateRequest: jest.fn().mockResolvedValue({
      success: true,
      metadata: { rateLimitRemaining: 25, keyName: 'test-key' },
    }),
    createErrorResponse: jest.fn((error: string, status = 400) => ({
      json: () => Promise.resolve({ error }),
      status,
    })),
    createSuccessResponse: jest.fn((data: unknown) => ({
      json: () => Promise.resolve(data),
      status: 200,
    })),
    handleCORS: jest.fn(() => ({
      status: 200,
    })),
  },
}));

// Helper function to create a mock NextRequest
const createMockRequest = (pathname: string, body: Record<string, unknown>) => {
  const bodyString = JSON.stringify(body);
  return {
    nextUrl: { pathname },
    text: jest.fn().mockResolvedValue(bodyString),
    headers: new Map([
      ['x-api-key', 'test-key'],
      ['content-type', 'application/json'],
    ]),
  } as unknown as NextRequest;
};

describe("RND API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/rnd/number", () => {
    it("should generate a random number", async () => {
      const req = createMockRequest("/api/rnd/number", { min: 1, max: 10 });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ result: 42 });
    });

    it("should return error for invalid input", async () => {
      const req = createMockRequest("/api/rnd/number", { min: "invalid", max: 10 });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("min and max must be numbers");
    });
  });

  describe("POST /api/rnd/boolean", () => {
    it("should generate a random boolean", async () => {
      const req = createMockRequest("/api/rnd/boolean", {});
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ result: true });
    });
  });

  describe("POST /api/rnd/choice", () => {
    it("should make a random choice", async () => {
      const req = createMockRequest("/api/rnd/choice", { choices: ["a", "b", "c"] });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ result: "choice1" });
    });

    it("should return error for empty choices", async () => {
      const req = createMockRequest("/api/rnd/choice", { choices: [] });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("choices must be a non-empty array");
    });
  });

  describe("POST /api/rnd/string", () => {
    it("should generate a random string", async () => {
      const req = createMockRequest("/api/rnd/string", { length: 10 });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ result: "randomstring" });
    });

    it("should return error for negative length", async () => {
      const req = createMockRequest("/api/rnd/string", { length: -1 });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("length must be a non-negative number");
    });
  });

  describe("POST /api/rnd/unknown", () => {
    it("should return error for unknown type", async () => {
      const req = createMockRequest("/api/rnd/unknown", {});
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Unknown rnd type");
    });
  });
});
