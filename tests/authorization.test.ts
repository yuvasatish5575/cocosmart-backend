import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerCustomer, loginAsAdmin, authHeader, unique } from "./helpers";

describe("Authorization boundaries", () => {
  it("cannot self-assign the ADMIN role through registration", async () => {
    const email = `${unique("wannabe-admin")}@example.com`;
    const res = await request(app)
      .post("/api/auth/register")
      // `role` isn't part of the registration schema — sending it should have zero effect.
      .send({ name: "Wannabe Admin", email, password: "Passw0rd!23", role: "ADMIN" });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("CUSTOMER");
  });

  const adminOnlyEndpoints = ["/api/admin/dashboard", "/api/admin/users", "/api/admin/orders", "/api/products/admin"];

  it.each(adminOnlyEndpoints)("blocks anonymous access to %s", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
  });

  it.each(adminOnlyEndpoints)("blocks a signed-in CUSTOMER from %s", async (path) => {
    const { accessToken } = await registerCustomer();
    const res = await request(app).get(path).set(authHeader(accessToken));
    expect(res.status).toBe(403);
  });

  it("allows an ADMIN through every admin-only endpoint", async () => {
    const { accessToken } = await loginAsAdmin();
    const dashboard = await request(app).get("/api/admin/dashboard").set(authHeader(accessToken));
    const users = await request(app).get("/api/admin/users").set(authHeader(accessToken));
    const orders = await request(app).get("/api/admin/orders").set(authHeader(accessToken));
    const products = await request(app).get("/api/products/admin").set(authHeader(accessToken));

    expect(dashboard.status).toBe(200);
    expect(users.status).toBe(200);
    expect(orders.status).toBe(200);
    expect(products.status).toBe(200);
  });

  it("rejects an expired/tampered JWT", async () => {
    const { accessToken } = await registerCustomer();
    const tampered = accessToken.slice(0, -3) + "xyz";
    const res = await request(app).get("/api/auth/me").set(authHeader(tampered));
    expect(res.status).toBe(401);
  });

  it("never returns a password hash anywhere in the auth response surface", async () => {
    const { accessToken } = await loginAsAdmin();
    const me = await request(app).get("/api/auth/me").set(authHeader(accessToken));
    const body = JSON.stringify(me.body);
    expect(body).not.toMatch(/passwordHash|\$argon2/);
  });
});
