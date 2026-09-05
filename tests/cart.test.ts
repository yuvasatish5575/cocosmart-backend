import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, registerCustomer, loginAsAdmin, authHeader, unique } from "./helpers";

describe("Cart", () => {
  let token: string;
  let flourId: string;
  let flourSize: string;
  let scarceId: string;
  const scarceSize = "1 unit";

  beforeAll(async () => {
    const { accessToken } = await registerCustomer();
    token = accessToken;

    const res = await request(app).get("/api/products/slug/coconut-flour");
    flourId = res.body.data.id;
    flourSize = res.body.data.sizes[0];

    // A product with deliberately scarce stock, dedicated to this file, so the
    // over-quantity test below can't be affected by what other test files do
    // to shared seeded products' stock levels.
    const { accessToken: adminToken } = await loginAsAdmin();
    const categories = await request(app).get("/api/categories");
    const scarce = await request(app)
      .post("/api/products")
      .set(authHeader(adminToken))
      .send({
        categoryId: categories.body.data.categories[0].id,
        name: "Scarce Test Product",
        slug: unique("scarce-test-product"),
        description: "A deliberately low-stock product used only by cart.test.ts.",
        shortDescription: "Scarce test product",
        price: 50,
        sku: unique("SCARCE"),
        stockQuantity: 3,
        unit: "unit",
        sizes: [scarceSize],
      });
    scarceId = scarce.body.data.id;
  });

  it("rejects cart access without authentication", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("starts empty for a new user", async () => {
    const res = await request(app).get("/api/cart").set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.lines).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it("adds an item and recomputes totals server-side", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(authHeader(token))
      .send({ productId: flourId, size: flourSize, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.lines).toHaveLength(1);
    expect(res.body.data.lines[0].qty).toBe(2);
    // 2 x 220 = 440, no discountPrice on coconut-flour, delivery applies below the free threshold.
    expect(res.body.data.subtotal).toBe(440);
    expect(res.body.data.total).toBe(res.body.data.subtotal + res.body.data.delivery);
  });

  it("merges a repeated add-to-cart into the same line instead of duplicating it", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(authHeader(token))
      .send({ productId: flourId, size: flourSize, quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.lines).toHaveLength(1);
    expect(res.body.data.lines[0].qty).toBe(3);
  });

  it("updates a line's quantity", async () => {
    const cart = await request(app).get("/api/cart").set(authHeader(token));
    const itemKey = cart.body.data.lines[0].key;

    const res = await request(app).patch(`/api/cart/items/${itemKey}`).set(authHeader(token)).send({ quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.lines[0].qty).toBe(1);
  });

  it("rejects adding more than the available stock", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(authHeader(token))
      .send({ productId: scarceId, size: scarceSize, quantity: 10 }); // only 3 in stock

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("removes a line item", async () => {
    const cart = await request(app).get("/api/cart").set(authHeader(token));
    const itemKey = cart.body.data.lines[0].key;

    const res = await request(app).delete(`/api/cart/items/${itemKey}`).set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.lines).toEqual([]);
  });

  it("rejects operating on another customer's cart line", async () => {
    const other = await registerCustomer();
    await request(app).post("/api/cart/items").set(authHeader(token)).send({ productId: flourId, size: flourSize, quantity: 1 });
    const myCart = await request(app).get("/api/cart").set(authHeader(token));
    const itemKey = myCart.body.data.lines[0].key;

    const res = await request(app).delete(`/api/cart/items/${itemKey}`).set(authHeader(other.accessToken));
    expect(res.status).toBe(404);
  });
});
