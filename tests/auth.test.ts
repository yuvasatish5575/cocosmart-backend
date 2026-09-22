import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerCustomer, authHeader, unique } from "./helpers";

describe("Auth", () => {
  it("registers a new customer without issuing tokens until the email is verified", async () => {
    const email = `${unique("newuser")}@example.com`;
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "New User", email, password: "Passw0rd!23", confirmPassword: "Passw0rd!23" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    // No session is issued until the account is verified.
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();
  });

  it("blocks login before the email is verified", async () => {
    const email = `${unique("unverified")}@example.com`;
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Unverified", email, password: "Passw0rd!23", confirmPassword: "Passw0rd!23" });

    const res = await request(app).post("/api/auth/login").send({ email, password: "Passw0rd!23" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("verifies the email and logs in as a CUSTOMER (full register -> verify -> login flow)", async () => {
    const { user } = await registerCustomer();
    expect(user.role).toBe("CUSTOMER");
    // The password must never be echoed back.
    expect((user as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("rejects registering the same (verified) email twice", async () => {
    const email = `${unique("dupe")}@example.com`;
    await registerCustomer({ email });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Dupe", email, password: "Passw0rd!23", confirmPassword: "Passw0rd!23" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("tells the caller to verify instead of duplicating an unverified account", async () => {
    const email = `${unique("stillunverified")}@example.com`;
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Still Unverified", email, password: "Passw0rd!23", confirmPassword: "Passw0rd!23" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Still Unverified", email, password: "Passw0rd!23", confirmPassword: "Passw0rd!23" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("rejects registration with an obviously weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Weak", email: `${unique("weak")}@example.com`, password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("logs in with correct credentials", async () => {
    const email = `${unique("login")}@example.com`;
    await registerCustomer({ email, password: "Passw0rd!23" });

    const res = await request(app).post("/api/auth/login").send({ email, password: "Passw0rd!23" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it("rejects login with an incorrect password", async () => {
    const email = `${unique("badpass")}@example.com`;
    await registerCustomer({ email, password: "Passw0rd!23" });

    const res = await request(app).post("/api/auth/login").send({ email, password: "WrongPassword!1" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects login for a nonexistent email without revealing whether the account exists", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "Whatever!123" });
    expect(res.status).toBe(401);
  });

  it("rejects /auth/me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid access token", async () => {
    const { accessToken, user } = await registerCustomer();
    const res = await request(app).get("/api/auth/me").set(authHeader(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  it("rejects a malformed/garbage access token", async () => {
    const res = await request(app).get("/api/auth/me").set(authHeader("not-a-real-token"));
    expect(res.status).toBe(401);
  });

  it("issues a new token pair from a valid refresh token", async () => {
    const { refreshToken } = await registerCustomer();
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");
  });

  it("rejects reusing a refresh token after logout (revocation)", async () => {
    const { refreshToken } = await registerCustomer();
    const logoutRes = await request(app).post("/api/auth/logout").send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const reuse = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});
