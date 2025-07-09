"use client";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

// Create API client without default API key (will be added per request)
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to create headers with optional API key
const createHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return headers;
};

// Base interface for all requests
export interface BaseRequest {
  apiKey?: string; // Optional API key for authenticated requests
}

export interface RandomNumberRequest extends BaseRequest {
  min: number;
  max: number;
}

export interface RandomFloatRequest extends BaseRequest {
  min?: number;
  max?: number;
}

export interface RandomChoiceRequest<T = unknown> extends BaseRequest {
  choices: T[];
}

export interface RandomStringRequest extends BaseRequest {
  length: number;
}

export interface RandomDateRequest extends BaseRequest {
  from: string | Date;
  to: string | Date;
}

export interface RandomShuffleRequest<T = unknown> extends BaseRequest {
  choices: T[];
}

export interface RandomWeightedRequest<T = unknown> extends BaseRequest {
  items: [T, number][];
}

export interface RandomPasswordRequest {
  length: number;
}

export interface ESP32RawStringRequest extends BaseRequest {
  count?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ESP32RawStringResponse {
  rawString?: string;
  rawStrings?: string[];
  length?: number;
  count?: number;
  requestedCount?: number;
  timestamp: string;
  source: string;
  filters?: {
    minLength?: number;
    maxLength?: number;
  };
}

export type RndRequestType =
  | "number"
  | "boolean"
  | "float"
  | "choice"
  | "string"
  | "color"
  | "date"
  | "uuid"
  | "shuffle"
  | "weighted"
  | "hsl"
  | "gradient"
  | "password"
  | "raw-string";

export interface RndRequest<T = unknown> {
  type: RndRequestType;
  params?: T;
}

export interface RndResponse<T = unknown> {
  result: T;
}

export interface RndErrorResponse {
  error: string;
}

export const useFetchRnd = <T = unknown>() => {
  return useMutation<RndResponse<T>, Error, RndRequest>({
    mutationFn: async ({ type, params = {} }) => {
      const { apiKey, ...requestParams } = params as BaseRequest & Record<string, unknown>;

      // Choose endpoint based on whether API key is provided
      const endpoint = apiKey ? `/api/rnd/${type}` : `/api/public/rnd/${type}`;

      const response = await apiClient.post<RndResponse<T> | RndErrorResponse>(
        endpoint,
        requestParams,
        {
          headers: createHeaders(apiKey),
        }
      );

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data as RndResponse<T>;
    },
  });
};

export const useFetchRandomNumber = () => {
  return useMutation<number, Error, RandomNumberRequest>({
    mutationFn: async (params) => {
      const { apiKey, ...requestParams } = params;
      const endpoint = apiKey ? "/api/rnd/number" : "/api/public/rnd/number";

      const response = await apiClient.post<
        RndResponse<number> | RndErrorResponse
      >(endpoint, requestParams, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomBoolean = () => {
  return useMutation<boolean, Error, BaseRequest>({
    mutationFn: async (params = {}) => {
      const { apiKey } = params;
      const endpoint = apiKey ? "/api/rnd/boolean" : "/api/public/rnd/boolean";

      const response = await apiClient.post<
        RndResponse<boolean> | RndErrorResponse
      >(endpoint, {}, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomFloat = () => {
  return useMutation<number, Error, RandomFloatRequest>({
    mutationFn: async (params = {}) => {
      const { apiKey, ...requestParams } = params;
      const endpoint = apiKey ? "/api/rnd/float" : "/api/public/rnd/float";

      const response = await apiClient.post<
        RndResponse<number> | RndErrorResponse
      >(endpoint, requestParams, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomChoice = <T = unknown>() => {
  return useMutation<T, Error, RandomChoiceRequest<T>>({
    mutationFn: async (params) => {
      const { apiKey, ...requestParams } = params;
      const endpoint = apiKey ? "/api/rnd/choice" : "/api/public/rnd/choice";

      const response = await apiClient.post<RndResponse<T> | RndErrorResponse>(
        endpoint,
        requestParams,
        {
          headers: createHeaders(apiKey),
        }
      );

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomString = () => {
  return useMutation<string, Error, RandomStringRequest>({
    mutationFn: async (params) => {
      const { apiKey, ...requestParams } = params;
      const endpoint = apiKey ? "/api/rnd/string" : "/api/public/rnd/string";

      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >(endpoint, requestParams, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomColor = () => {
  return useMutation<string, Error, BaseRequest>({
    mutationFn: async (params = {}) => {
      const { apiKey } = params;
      const endpoint = apiKey ? "/api/rnd/color" : "/api/public/rnd/color";

      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >(endpoint, {}, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomDate = () => {
  return useMutation<string, Error, RandomDateRequest>({
    mutationFn: async (params) => {
      const { apiKey, ...requestParams } = params;
      const endpoint = apiKey ? "/api/rnd/date" : "/api/public/rnd/date";

      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >(endpoint, requestParams, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomUUID = () => {
  return useMutation<string, Error, BaseRequest>({
    mutationFn: async (params = {}) => {
      const { apiKey } = params;
      const endpoint = apiKey ? "/api/rnd/uuid" : "/api/public/rnd/uuid";

      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >(endpoint, {}, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomShuffle = <T = unknown>() => {
  return useMutation<T[], Error, RandomShuffleRequest<T>>({
    mutationFn: async (params) => {
      const { apiKey, ...requestParams } = params;
      const endpoint = apiKey ? "/api/rnd/shuffle" : "/api/public/rnd/shuffle";

      const response = await apiClient.post<
        RndResponse<T[]> | RndErrorResponse
      >(endpoint, requestParams, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomWeighted = <T = unknown>() => {
  return useMutation<T, Error, RandomWeightedRequest<T>>({
    mutationFn: async (params) => {
      const { apiKey, ...requestParams } = params;
      const endpoint = apiKey ? "/api/rnd/weighted" : "/api/public/rnd/weighted";

      const response = await apiClient.post<RndResponse<T> | RndErrorResponse>(
        endpoint,
        requestParams,
        {
          headers: createHeaders(apiKey),
        }
      );

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomHslColor = () => {
  return useMutation<string, Error, BaseRequest>({
    mutationFn: async (params = {}) => {
      const { apiKey } = params;
      const endpoint = apiKey ? "/api/rnd/hsl" : "/api/public/rnd/hsl";

      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >(endpoint, {}, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomGradient = () => {
  return useMutation<string, Error, BaseRequest>({
    mutationFn: async (params = {}) => {
      const { apiKey } = params;
      const endpoint = apiKey ? "/api/rnd/gradient" : "/api/public/rnd/gradient";

      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >(endpoint, {}, {
        headers: createHeaders(apiKey),
      });

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomPassword = () => {
  return useMutation<string, Error, RandomPasswordRequest>({
    mutationFn: async (params) => {
      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >("/api/rnd/password", params);

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchESP32RawString = () => {
  return useMutation<ESP32RawStringResponse, Error, ESP32RawStringRequest>({
    mutationFn: async (params) => {
      const { apiKey, count, minLength, maxLength } = params;

      if (!apiKey) {
        throw new Error("API key is required for ESP32 raw string access");
      }

      // Use GET for single string, POST for multiple strings with filters
      if (count && count > 1) {
        const response = await apiClient.post<ESP32RawStringResponse>(
          "/api/esp32/raw-string",
          { count, minLength, maxLength },
          {
            headers: createHeaders(apiKey),
          }
        );
        return response.data;
      } else {
        const response = await apiClient.get<ESP32RawStringResponse>(
          "/api/esp32/raw-string",
          {
            headers: createHeaders(apiKey),
          }
        );
        return response.data;
      }
    },
  });
};
