"use client";
import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Props {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export const QCP = ({ children }: Readonly<Props>) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
