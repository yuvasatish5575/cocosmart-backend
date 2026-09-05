import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerCustomer, loginAsAdmin, authHeader, unique } from "./helpers";

describe("Products", () => {
  it("lists products publicly, without auth", async () => {
    const res = await request(app).get("/api/products").query({ limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(9);
  });

  it("searches products by keyword", async () => {
    const res = await request(app).get("/api/products").query({ search: "coconut oil" });
    expect(res.status).toBe(200);
    expect(res.body.data.products.some((p: { slug: string }) => p.slug === "virgin-coconut-oil")).toBe(true);
  });

  it("filters products by category slug", async () => {
    const res = await request(app).get("/api/products").query({ category: "coconut-oil" });
    expect(res.status).toBe(200);
    for (const p of res.body.data.products) {
      expect(p.categorySlug).toBe("coconut-oil");
    }
  });

  it("fetches a single product by slug", async () => {
    const res = await request(app).get("/api/products/slug/tender-coconut-water");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Tender Coconut Water");
    // `price` is the effective (already-discounted) price a customer pays; `mrp` is the pre-discount price.
    expect(res.body.data.price).toBe(120);
    expect(res.body.data.mrp).toBe(140);
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await request(app).get("/api/products/slug/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("blocks anonymous access to the admin product list", async () => {
    const res = await request(app).get("/api/products/admin");
    expect(res.status).toBe(401);
  });

  it("blocks a signed-in customer from the admin product list", async () => {
    const { accessToken } = await registerCustomer();
    const res = await request(app).get("/api/products/admin").set(authHeader(accessToken));
    expect(res.status).toBe(403);
  });

  it("blocks a signed-in customer from creating a product", async () => {
    const { accessToken } = await registerCustomer();
    const res = await request(app)
      .post("/api/products")
      .set(authHeader(accessToken))
      .send({ name: "Hack Attempt", slug: unique("hack"), categoryId: "00000000-0000-0000-0000-000000000000" });
    expect(res.status).toBe(403);
  });

  it("lets an admin create, update and deactivate a product", async () => {
    const { accessToken } = await loginAsAdmin();

    const categories = await request(app).get("/api/categories");
    const categoryId = categories.body.data.categories[0].id;
    const slug = unique("admin-test-product");

    const create = await request(app)
      .post("/api/products")
      .set(authHeader(accessToken))
      .send({
        categoryId,
        name: "Admin Test Product",
        slug,
        description: "A product created directly by an automated test.",
        shortDescription: "Test product",
        price: 99,
        sku: unique("SKU"),
        stockQuantity: 10,
        unit: "unit",
      });
    expect(create.status).toBe(201);
    expect(create.body.data.slug).toBe(slug);
    const productId = create.body.data.id;

    const update = await request(app)
      .patch(`/api/products/${productId}`)
      .set(authHeader(accessToken))
      .send({ stockQuantity: 25 });
    expect(update.status).toBe(200);
    expect(update.body.data.stockQuantity).toBe(25);

    const deactivate = await request(app).delete(`/api/products/${productId}`).set(authHeader(accessToken));
    expect(deactivate.status).toBe(204);

    // Deactivated products don't show up in the public storefront listing.
    const publicLookup = await request(app).get(`/api/products/slug/${slug}`);
    expect(publicLookup.status).toBe(404);
  });
});
