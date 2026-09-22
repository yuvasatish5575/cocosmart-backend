import "./testEnv";
import request from "supertest";
import { vi } from "vitest";
import { createApp } from "../src/app";
import { emailService } from "../src/services/emailService";

export const app = createApp();

export function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

interface RegisteredUser {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: "CUSTOMER" | "ADMIN" };
}

/**
 * Registers, captures the verification code the app "emailed" (by spying on
 * emailService instead of scraping a real inbox), verifies, then logs in —
 * exercising the real production flow end-to-end rather than a shortcut, so
 * every test that needs a logged-in customer also doubles as a regression
 * test for registration + email verification.
 */
export async function registerCustomer(overrides: Partial<{ name: string; email: string; password: string }> = {}): Promise<RegisteredUser> {
  const email = overrides.email ?? `${unique("customer")}@example.com`;
  const password = overrides.password ?? "Passw0rd!23";

  const spy = vi.spyOn(emailService, "sendVerificationEmail");
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: overrides.name ?? "Test Customer", email, password, confirmPassword: password });
  if (res.status !== 201) {
    spy.mockRestore();
    throw new Error(`registerCustomer failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const code = spy.mock.calls.at(-1)?.[1];
  spy.mockRestore();
  if (!code) {
    throw new Error("registerCustomer: no verification code was captured from emailService.sendVerificationEmail");
  }

  const verifyRes = await request(app).post("/api/auth/verify-email").send({ email, code });
  if (verifyRes.status !== 200) {
    throw new Error(`registerCustomer: verify-email failed: ${verifyRes.status} ${JSON.stringify(verifyRes.body)}`);
  }

  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  if (loginRes.status !== 200) {
    throw new Error(`registerCustomer: login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }
  return loginRes.body.data;
}

export async function loginAsAdmin(): Promise<RegisteredUser> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`loginAsAdmin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
