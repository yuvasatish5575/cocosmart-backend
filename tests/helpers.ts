import "./testEnv";
import request from "supertest";
import { createApp } from "../src/app";

export const app = createApp();

export function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

interface RegisteredUser {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: "CUSTOMER" | "ADMIN" };
}

export async function registerCustomer(overrides: Partial<{ name: string; email: string; password: string }> = {}): Promise<RegisteredUser> {
  const email = overrides.email ?? `${unique("customer")}@example.com`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: overrides.name ?? "Test Customer", email, password: overrides.password ?? "Passw0rd!23" });
  if (res.status !== 201) {
    throw new Error(`registerCustomer failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
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
