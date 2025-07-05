"use client";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

// Type definitions for all random generation types
export interface RandomNumberRequest {
  min: number;
  max: number;
}

export interface RandomFloatRequest {
  min?: number;
  max?: number;
}

export interface RandomChoiceRequest<T = unknown> {
  choices: T[];
}

export interface RandomStringRequest {
  length: number;
}

export interface RandomDateRequest {
  from: string | Date;
  to: string | Date;
}

export interface RandomShuffleRequest<T = unknown> {
  choices: T[];
}

export interface RandomWeightedRequest<T = unknown> {
  items: [T, number][];
}

export interface RandomPasswordRequest {
  length: number;
}

// Union type for all possible request types
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

// Generic request interface
export interface RndRequest<T = unknown> {
  type: RndRequestType;
  params?: T;
}

// Response interface
export interface RndResponse<T = unknown> {
  result: T;
}

// Error response interface
export interface RndErrorResponse {
  error: string;
}

// Main hook for all random generation types
export const useFetchRnd = <T = unknown>() => {
  return useMutation<RndResponse<T>, Error, RndRequest>({
    mutationFn: async ({ type, params = {} }) => {
      const response = await axios.post<RndResponse<T> | RndErrorResponse>(
        `/api/rnd/${type}`,
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data as RndResponse<T>;
    },
  });
};

// Specialized hooks for specific types with better type safety
export const useFetchRandomNumber = () => {
  return useMutation<number, Error, RandomNumberRequest>({
    mutationFn: async (params) => {
      const response = await axios.post<RndResponse<number> | RndErrorResponse>(
        "/api/rnd/number",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomBoolean = () => {
  return useMutation<boolean, Error, void>({
    mutationFn: async () => {
      const response = await axios.post<RndResponse<boolean> | RndErrorResponse>(
        "/api/rnd/boolean",
        {}
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomFloat = () => {
  return useMutation<number, Error, RandomFloatRequest>({
    mutationFn: async (params = {}) => {
      const response = await axios.post<RndResponse<number> | RndErrorResponse>(
        "/api/rnd/float",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomChoice = <T = unknown>() => {
  return useMutation<T, Error, RandomChoiceRequest<T>>({
    mutationFn: async (params) => {
      const response = await axios.post<RndResponse<T> | RndErrorResponse>(
        "/api/rnd/choice",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomString = () => {
  return useMutation<string, Error, RandomStringRequest>({
    mutationFn: async (params) => {
      const response = await axios.post<RndResponse<string> | RndErrorResponse>(
        "/api/rnd/string",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomColor = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await axios.post<RndResponse<string> | RndErrorResponse>(
        "/api/rnd/color",
        {}
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomDate = () => {
  return useMutation<string, Error, RandomDateRequest>({
    mutationFn: async (params) => {
      const response = await axios.post<RndResponse<string> | RndErrorResponse>(
        "/api/rnd/date",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomUUID = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await axios.post<RndResponse<string> | RndErrorResponse>(
        "/api/rnd/uuid",
        {}
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomShuffle = <T = unknown>() => {
  return useMutation<T[], Error, RandomShuffleRequest<T>>({
    mutationFn: async (params) => {
      const response = await axios.post<RndResponse<T[]> | RndErrorResponse>(
        "/api/rnd/shuffle",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomWeighted = <T = unknown>() => {
  return useMutation<T, Error, RandomWeightedRequest<T>>({
    mutationFn: async (params) => {
      const response = await axios.post<RndResponse<T> | RndErrorResponse>(
        "/api/rnd/weighted",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomHslColor = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await axios.post<RndResponse<string> | RndErrorResponse>(
        "/api/rnd/hsl",
        {}
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomGradient = () => {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      const response = await axios.post<RndResponse<string> | RndErrorResponse>(
        "/api/rnd/gradient",
        {}
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};

export const useFetchRandomPassword = () => {
  return useMutation<string, Error, RandomPasswordRequest>({
    mutationFn: async (params) => {
      const response = await axios.post<RndResponse<string> | RndErrorResponse>(
        "/api/rnd/password",
        params
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    },
  });
};
