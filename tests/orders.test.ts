import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerCustomer, loginAsAdmin, authHeader } from "./helpers";

const NEW_ADDRESS = {
  fullName: "Order Tester",
  phone: "9876500000",
  addressLine1: "1 Test Lane",
  city: "Kochi",
  state: "Kerala",
  postalCode: "682001",
};

async function getProductByslug(slug: string) {
  const res = await request(app).get(`/api/products/slug/${slug}`);
  return res.body.data as { id: string; sizes: string[]; stockQuantity: number };
}

describe("Orders / Checkout", () => {
  it("rejects checkout with an empty cart", async () => {
    const { accessToken } = await registerCustomer();
    const res = await request(app)
      .post("/api/orders")
      .set(authHeader(accessToken))
      .send({ paymentMethod: "COD", newAddress: NEW_ADDRESS });
    expect(res.status).toBe(400);
  });

  it("rejects checkout without an address", async () => {
    const { accessToken } = await registerCustomer();
    const product = await getProductByslug("coconut-flour");
    await request(app)
      .post("/api/cart/items")
      .set(authHeader(accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 1 });

    const res = await request(app).post("/api/orders").set(authHeader(accessToken)).send({ paymentMethod: "COD" });
    expect(res.status).toBe(400);
  });

  it("computes totals server-side from live product prices, decrements stock, and clears the cart", async () => {
    const { accessToken } = await registerCustomer();
    const product = await getProductByslug("virgin-coconut-oil"); // seeded: price 380, discountPrice 340, stock 4
    const startingStock = product.stockQuantity;

    await request(app)
      .post("/api/cart/items")
      .set(authHeader(accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 2 });

    const checkout = await request(app)
      .post("/api/orders")
      .set(authHeader(accessToken))
      .send({ paymentMethod: "COD", deliverySlot: "Tomorrow, 9am-12pm", newAddress: NEW_ADDRESS });

    expect(checkout.status).toBe(201);
    const order = checkout.body.data;
    expect(order.subtotal).toBe(680); // 2 x discountPrice(340)
    expect(order.discount).toBe(80); // 2 x (380 - 340)
    expect(order.shippingCost).toBe(40); // below the free-delivery threshold
    expect(order.totalAmount).toBe(720);
    expect(order.orderStatus).toBe("PENDING");
    expect(order.paymentStatus).toBe("PENDING"); // never marked PAID without real gateway verification
    expect(order.items).toHaveLength(1);
    expect(order.items[0].price).toBe(340); // the price actually charged is the server's, not a client-supplied one

    const afterProduct = await getProductByslug("virgin-coconut-oil");
    expect(afterProduct.stockQuantity).toBe(startingStock - 2);

    const cart = await request(app).get("/api/cart").set(authHeader(accessToken));
    expect(cart.body.data.lines).toEqual([]);
  });

  it("ignores a client-supplied price/total and always recomputes from the database", async () => {
    const { accessToken } = await registerCustomer();
    const product = await getProductByslug("coconut-flour"); // price 220, no discount
    await request(app)
      .post("/api/cart/items")
      .set(authHeader(accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 1 });

    const checkout = await request(app)
      .post("/api/orders")
      .set(authHeader(accessToken))
      // These bogus fields aren't part of the checkout schema and must have zero effect.
      .send({ paymentMethod: "COD", newAddress: NEW_ADDRESS, totalAmount: 1, subtotal: 1, price: 1 });

    expect(checkout.status).toBe(201);
    expect(checkout.body.data.subtotal).toBe(220);
    expect(checkout.body.data.totalAmount).toBe(260); // 220 + 40 delivery
  });

  it("blocks checkout if stock drops below the cart quantity between add-to-cart and checkout (no overselling)", async () => {
    const { accessToken } = await registerCustomer();
    const { accessToken: adminToken } = await loginAsAdmin();
    const product = await getProductByslug("coconut-cream"); // seeded with 45 in stock

    await request(app)
      .post("/api/cart/items")
      .set(authHeader(accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 3 });

    // Simulate another sale draining stock after this cart line was added.
    await request(app).patch(`/api/products/${product.id}`).set(authHeader(adminToken)).send({ stockQuantity: 2 });

    const checkout = await request(app)
      .post("/api/orders")
      .set(authHeader(accessToken))
      .send({ paymentMethod: "COD", newAddress: NEW_ADDRESS });

    expect(checkout.status).toBe(409);
    expect(checkout.body.error.code).toBe("INSUFFICIENT_STOCK");

    // A failed checkout must not partially decrement stock or silently clear the cart.
    const afterProduct = await getProductByslug("coconut-cream");
    expect(afterProduct.stockQuantity).toBe(2);
    const cart = await request(app).get("/api/cart").set(authHeader(accessToken));
    expect(cart.body.data.lines).toHaveLength(1);
  });

  it("never lets stock go negative even at the exact boundary, and blocks a second buyer once it hits zero", async () => {
    const { accessToken: adminToken } = await loginAsAdmin();
    const product = await getProductByslug("coconut-milk-powder");
    await request(app).patch(`/api/products/${product.id}`).set(authHeader(adminToken)).send({ stockQuantity: 2 });

    const buyerA = await registerCustomer();
    await request(app)
      .post("/api/cart/items")
      .set(authHeader(buyerA.accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 2 });
    const orderA = await request(app)
      .post("/api/orders")
      .set(authHeader(buyerA.accessToken))
      .send({ paymentMethod: "COD", newAddress: NEW_ADDRESS });
    expect(orderA.status).toBe(201);

    const depleted = await getProductByslug("coconut-milk-powder");
    expect(depleted.stockQuantity).toBe(0);

    const buyerB = await registerCustomer();
    const addToCart = await request(app)
      .post("/api/cart/items")
      .set(authHeader(buyerB.accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 1 });
    expect(addToCart.status).toBe(409);
  });

  it("lets a customer list and read their own orders, and returns 404 (not 403) for someone else's order", async () => {
    const { accessToken } = await registerCustomer();
    const product = await getProductByslug("coconut-flour");
    await request(app)
      .post("/api/cart/items")
      .set(authHeader(accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 1 });
    const checkout = await request(app)
      .post("/api/orders")
      .set(authHeader(accessToken))
      .send({ paymentMethod: "UPI", newAddress: NEW_ADDRESS });
    const orderId = checkout.body.data.id;

    const mine = await request(app).get(`/api/orders/${orderId}`).set(authHeader(accessToken));
    expect(mine.status).toBe(200);

    const stranger = await registerCustomer();
    const blocked = await request(app).get(`/api/orders/${orderId}`).set(authHeader(stranger.accessToken));
    expect(blocked.status).toBe(404);
  });

  it("lets an admin update order status but blocks a customer from doing so", async () => {
    const { accessToken } = await registerCustomer();
    const { accessToken: adminToken } = await loginAsAdmin();
    const product = await getProductByslug("coconut-flour");
    await request(app)
      .post("/api/cart/items")
      .set(authHeader(accessToken))
      .send({ productId: product.id, size: product.sizes[0], quantity: 1 });
    const checkout = await request(app)
      .post("/api/orders")
      .set(authHeader(accessToken))
      .send({ paymentMethod: "COD", newAddress: NEW_ADDRESS });
    const orderId = checkout.body.data.id;

    const blocked = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set(authHeader(accessToken))
      .send({ orderStatus: "CONFIRMED" });
    expect(blocked.status).toBe(403);

    const allowed = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set(authHeader(adminToken))
      .send({ orderStatus: "CONFIRMED" });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.orderStatus).toBe("CONFIRMED");
  });
});
