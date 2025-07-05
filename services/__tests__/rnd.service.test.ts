import axios from "axios";
import { randomNumber, randomBoolean, randomFloat, randomChoice, randomString } from "../rnd.service";

// Mock axios to avoid making real HTTP requests during tests
jest.mock("axios");
const mockedAxios = jest.mocked(axios);

describe("RND Service", () => {
  beforeEach(() => {
    // Mock the axios response
    mockedAxios.get.mockResolvedValue({
      data: "test-random-string-12345",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("randomNumber", () => {
    it("should generate a number within the specified range", async () => {
      const min = 1;
      const max = 10;
      const result = await randomNumber(min, max);
      
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("should throw error for invalid input", async () => {
      await expect(randomNumber("1" as any, 10)).rejects.toThrow("min and max must be numbers");
      await expect(randomNumber(10, 5)).rejects.toThrow("min cannot be greater than max");
    });
  });

  describe("randomBoolean", () => {
    it("should return a boolean", async () => {
      const result = await randomBoolean();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("randomFloat", () => {
    it("should return a float between 0 and 1 by default", async () => {
      const result = await randomFloat();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("should return a float within specified range", async () => {
      const min = 5;
      const max = 10;
      const result = await randomFloat(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });
  });

  describe("randomChoice", () => {
    it("should return an element from the array", async () => {
      const arr = ["a", "b", "c", "d"];
      const result = await randomChoice(arr);
      expect(arr).toContain(result);
    });

    it("should throw error for empty array", async () => {
      await expect(randomChoice([])).rejects.toThrow("Array cannot be empty");
    });
  });

  describe("randomString", () => {
    it("should generate a string of specified length", async () => {
      const length = 10;
      const result = await randomString(length);
      expect(result).toHaveLength(length);
    });

    it("should return empty string for length 0", async () => {
      const result = await randomString(0);
      expect(result).toBe("");
    });

    it("should throw error for negative length", async () => {
      await expect(randomString(-1)).rejects.toThrow("Length cannot be negative");
    });
  });
});
