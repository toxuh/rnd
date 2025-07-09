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
  | "password";

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
      const { apiKey, ...requestParams } = params;

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
      const response = await apiClient.post<
        RndResponse<number> | RndErrorResponse
      >("/api/rnd/float", params);

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
      const response = await apiClient.post<RndResponse<T> | RndErrorResponse>(
        "/api/rnd/choice",
        params,
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
      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >("/api/rnd/string", params);

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomColor = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >("/api/rnd/color", {});

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
      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >("/api/rnd/date", params);

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomUUID = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >("/api/rnd/uuid", {});

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
      const response = await apiClient.post<
        RndResponse<T[]> | RndErrorResponse
      >("/api/rnd/shuffle", params);

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
      const response = await apiClient.post<RndResponse<T> | RndErrorResponse>(
        "/api/rnd/weighted",
        params,
      );

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomHslColor = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >("/api/rnd/hsl", {});

      if ("error" in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomGradient = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<
        RndResponse<string> | RndErrorResponse
      >("/api/rnd/gradient", {});

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
