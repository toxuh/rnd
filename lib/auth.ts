import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";

export interface AuthResult {
  success: boolean;
  error?: string;
  keyInfo?: {
    name: string;
    permissions: string[];
    rateLimit?: number;
  };
}

export class APIKeyAuth {
  private validKeys: Map<
    string,
    {
      name: string;
      permissions: string[];
      rateLimit?: number;
      hashedKey: string;
    }
  > = new Map();

  constructor() {
    this.loadAPIKeys();
  }

  private loadAPIKeys(): void {
    const keys = [
      {
        name: "main-app",
        key: process.env.API_KEY_MAIN || this.generateAPIKey(),
        permissions: ["random:*"],
        rateLimit: 100,
      },
      {
        name: "admin",
        key: process.env.API_KEY_ADMIN || this.generateAPIKey(),
        permissions: ["*"],
        rateLimit: 1000,
      },
      {
        name: "limited",
        key: process.env.API_KEY_LIMITED || this.generateAPIKey(),
        permissions: ["random:number", "random:boolean"],
        rateLimit: 10,
      },
    ];

    keys.forEach(({ name, key, permissions, rateLimit }) => {
      const hashedKey = this.hashKey(key);
      this.validKeys.set(hashedKey, {
        name,
        permissions,
        rateLimit,
        hashedKey,
      });
    });

    if (process.env.NODE_ENV === "development") {
      console.log("=== API Keys (Development Only) ===");
      keys.forEach(({ name, key }) => {
        console.log(`${name}: ${key}`);
      });
      console.log("===================================");
    }
  }

  private hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  private generateAPIKey(): string {
    return `rnd_${randomBytes(32).toString("hex")}`;
  }

  private hasPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    if (userPermissions.includes("*")) {
      return true;
    }

    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    for (const permission of userPermissions) {
      if (permission.endsWith(":*")) {
        const prefix = permission.slice(0, -2);
        if (requiredPermission.startsWith(prefix + ":")) {
          return true;
        }
      }
    }

    return false;
  }

  async authenticate(
    req: NextRequest,
    requiredPermission: string = "random:read",
  ): Promise<AuthResult> {
    if (process.env.DISABLE_API_KEY_AUTH === "true") {
      return {
        success: true,
        keyInfo: {
          name: "disabled",
          permissions: ["*"],
        },
      };
    }

    const apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return {
        success: false,
        error:
          "API key is required. Please provide it in the x-api-key header.",
      };
    }

    const hashedKey = this.hashKey(apiKey);

    const keyInfo = this.validKeys.get(hashedKey);

    if (!keyInfo) {
      return {
        success: false,
        error: "Invalid API key.",
      };
    }

    if (!this.hasPermission(keyInfo.permissions, requiredPermission)) {
      return {
        success: false,
        error: `Insufficient permissions. Required: ${requiredPermission}`,
      };
    }

    return {
      success: true,
      keyInfo: {
        name: keyInfo.name,
        permissions: keyInfo.permissions,
        rateLimit: keyInfo.rateLimit,
      },
    };
  }

  validateOrigin(req: NextRequest): boolean {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

    if (allowedOrigins.length === 0) {
      return true;
    }

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    if (origin && allowedOrigins.includes(origin)) {
      return true;
    }

    if (referer) {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.includes(refererOrigin)) {
        return true;
      }
    }

    return false;
  }

  validateSignature(req: NextRequest, body: string): boolean {
    const signature = req.headers.get("x-signature");
    const timestamp = req.headers.get("x-timestamp");
    const secret = process.env.WEBHOOK_SECRET;

    if (!signature || !timestamp || !secret) {
      return false;
    }

    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return false;
    }

    const expectedSignature = createHash("sha256")
      .update(`${timestamp}.${body}`)
      .digest("hex");

    return signature === `sha256=${expectedSignature}`;
  }
}

export const apiKeyAuth = new APIKeyAuth();
