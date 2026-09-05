import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { hashPassword } from "../src/utils/password";
import { generateOrderNumber } from "../src/utils/orderNumber";

const prisma = new PrismaClient();

const waterBenefits = [
  { title: "Naturally Hydrating", description: "Drawn from tender coconuts, lightly filtered, nothing added.", icon: "droplet" },
  { title: "No Added Sugar", description: "Just what came out of the coconut — no syrups, no concentrate.", icon: "leaf" },
  { title: "Carefully Sourced", description: "Traceable to the farm and harvest batch where data is available.", icon: "sprout" },
  { title: "Quality Controlled", description: "Produced through a defined process and quality-release checks.", icon: "shield" },
];
const milkBenefits = [
  { title: "Plant-Based", description: "A dairy-free alternative made from cold-pressed coconut.", icon: "leaf" },
  { title: "Smooth & Versatile", description: "Works in curries, coffee, baking and everyday cooking.", icon: "sparkles" },
  { title: "Carefully Sourced", description: "Traceable sourcing where available.", icon: "sprout" },
  { title: "Quality Controlled", description: "Produced through defined quality processes.", icon: "shield" },
];
const oilBenefits = [
  { title: "Cold-Pressed", description: "Single extraction, no heat, no chemical processing.", icon: "flame" },
  { title: "Everyday Friendly", description: "Suited for cooking, and traditional hair & skin use.", icon: "sparkles" },
  { title: "Carefully Sourced", description: "Traceable sourcing where available.", icon: "sprout" },
  { title: "Quality Controlled", description: "Tested against defined product standards.", icon: "shield" },
];
const flourBenefits = [
  { title: "Sun-Dried", description: "Gently dried and milled to preserve natural flavour.", icon: "leaf" },
  { title: "Baking Friendly", description: "A versatile addition to baking and traditional recipes.", icon: "sparkles" },
  { title: "Carefully Sourced", description: "Traceable sourcing where available.", icon: "sprout" },
  { title: "Quality Controlled", description: "Moisture and hygiene checked before release.", icon: "shield" },
];
const creamBenefits = [
  { title: "Extra Rich", description: "Skimmed from the first press, no water added.", icon: "sparkles" },
  { title: "Plant-Based", description: "A dairy-free alternative for cooking and desserts.", icon: "leaf" },
  { title: "Carefully Sourced", description: "Traceable sourcing where available.", icon: "sprout" },
  { title: "Quality Controlled", description: "Produced through defined quality processes.", icon: "shield" },
];

const waterNutrition = [
  { label: "Energy", value: "19 kcal" },
  { label: "Carbohydrates", value: "3.7 g" },
  { label: "Sugars", value: "2.6 g" },
  { label: "Protein", value: "0.7 g" },
  { label: "Sodium", value: "105 mg" },
  { label: "Potassium", value: "250 mg" },
];

const categories = [
  { name: "Coconut Water", slug: "coconut-water", description: "Naturally hydrating, straight from tender coconuts", tone: "leaf" as const },
  { name: "Coconut Milk", slug: "coconut-milk", description: "Smooth, plant-based, cold-pressed", tone: "cream" as const },
  { name: "Coconut Cream", slug: "coconut-cream", description: "Rich and thick for cooking & desserts", tone: "gold" as const },
  { name: "Coconut Oil", slug: "coconut-oil", description: "Cold-pressed, unrefined, first extraction", tone: "gold" as const },
  { name: "Coconut Flour", slug: "coconut-flour", description: "Sun-dried, finely milled, for baking", tone: "cream" as const },
];

const traceCT24081A = {
  available: true,
  batchId: "CT-24081-A",
  farmName: "Murugan Coconut Grove",
  farmLocation: "Pollachi, Tamil Nadu",
  harvestDate: "12 Aug 2026",
  processedDate: "12 Aug 2026",
  qualityCheckedBy: "CocoSmart QA Lab, Coimbatore",
};
const traceCT24076C = {
  available: true,
  batchId: "CT-24076-C",
  farmName: "Kaithavana Estate",
  farmLocation: "Thrissur, Kerala",
  harvestDate: "6 Aug 2026",
  processedDate: "7 Aug 2026",
  qualityCheckedBy: "CocoSmart QA Lab, Kochi",
};
const traceCT24069B = {
  available: true,
  batchId: "CT-24069-B",
  farmName: "Backwater Palms Collective",
  farmLocation: "Alappuzha, Kerala",
  harvestDate: "29 Jul 2026",
  processedDate: "30 Jul 2026",
  qualityCheckedBy: "CocoSmart QA Lab, Kochi",
};
const traceCT24082A = {
  available: true,
  batchId: "CT-24082-A",
  farmName: "Kaithavana Estate",
  farmLocation: "Thrissur, Kerala",
  harvestDate: "13 Aug 2026",
  processedDate: "13 Aug 2026",
  qualityCheckedBy: "CocoSmart QA Lab, Kochi",
};
const traceUnavailable = { available: false };

// Local catalogue photography (backend/public equivalent: served from the
// frontend's public/product-images/). Only these four products have real
// photography right now; the rest explicitly clear image/images so a
// re-seed can't leave a stale reference to a file that doesn't exist —
// they fall back to the illustrated placeholder (see ProductMedia).
const productMedia: Record<string, { image: string | null; images: string[] }> = {
  "tender-coconut-water": { image: "/product-images/tender-coconut-water.png", images: ["/product-images/tender-coconut-water.png"] },
  "coconut-water-6-pack": { image: "/product-images/tender-coconut-water.png", images: ["/product-images/tender-coconut-water.png"] },
  "mature-coconut-water": { image: "/product-images/tender-coconut-water.png", images: ["/product-images/tender-coconut-water.png"] },
  "premium-coconut-milk": { image: "/product-images/coconut-milk.png", images: ["/product-images/coconut-milk.png"] },
  "virgin-coconut-oil": { image: "/product-images/virgin-coconut-oil.png", images: ["/product-images/virgin-coconut-oil.png"] },
  "coconut-oil-family-pack": { image: "/product-images/virgin-coconut-oil.png", images: ["/product-images/virgin-coconut-oil.png"] },
  "coconut-milk-powder": { image: "/product-images/coconut-powder.png", images: ["/product-images/coconut-powder.png"] },
  "coconut-flour": { image: null, images: [] },
  "coconut-cream": { image: null, images: [] },
};

const products = [
  {
    categorySlug: "coconut-water",
    name: "Tender Coconut Water",
    slug: "tender-coconut-water",
    sku: "CS-WATER-MIX",
    shortDescription: "Naturally sweet, lightly filtered, nothing added.",
    description:
      "Naturally sweet tender coconut water, harvested young and lightly filtered within hours of tapping. No added sugar, no preservatives, no concentrate — just what came out of the coconut, traced back to the farm that grew it.",
    price: 140,
    discountPrice: 120,
    stockQuantity: 120,
    unit: "bottle",
    sizes: ["330ml", "500ml", "1L"],
    tone: "leaf" as const,
    rating: 4.6,
    reviewCount: 212,
    isFeatured: true,
    benefits: waterBenefits,
    ingredients: ["100% Tender Coconut Water"],
    nutritionalInformation: waterNutrition,
    storage: "Refrigerate after opening. Consume within 24 hours. Best served chilled.",
    origin: "Pollachi, Tamil Nadu",
    traceability: traceCT24081A,
  },
  {
    categorySlug: "coconut-milk",
    name: "Premium Coconut Milk",
    slug: "premium-coconut-milk",
    sku: "CS-MILK-PREM",
    shortDescription: "Smooth, cold-pressed, dairy-free.",
    description:
      "Rich, cold-pressed coconut milk made from the first press of mature coconut flesh. Smooth and consistent, with no stabilisers — suited for curries, coffee and desserts.",
    price: 210,
    discountPrice: 180,
    stockQuantity: 80,
    unit: "bottle",
    sizes: ["500ml", "1L"],
    tone: "cream" as const,
    rating: 4.8,
    reviewCount: 156,
    isFeatured: true,
    benefits: milkBenefits,
    ingredients: ["Coconut Extract (72%)", "Water"],
    nutritionalInformation: [
      { label: "Energy", value: "180 kcal" },
      { label: "Fat", value: "18 g" },
      { label: "Carbohydrates", value: "3 g" },
      { label: "Protein", value: "1.8 g" },
    ],
    storage: "Shake well before use. Refrigerate after opening, consume within 3 days.",
    origin: "Thrissur, Kerala",
    traceability: traceCT24076C,
  },
  {
    categorySlug: "coconut-oil",
    name: "Virgin Coconut Oil",
    slug: "virgin-coconut-oil",
    sku: "CS-OIL-VIRGIN",
    shortDescription: "Cold-pressed, unrefined, first extraction.",
    description:
      "Single cold-pressed from fresh coconut milk within hours of harvest — no heat, no chemicals. Retains natural aroma, suited for cooking and traditional skin & hair use.",
    price: 380,
    discountPrice: 340,
    stockQuantity: 4,
    unit: "bottle",
    sizes: ["250ml", "500ml", "1L"],
    tone: "gold" as const,
    rating: 4.5,
    reviewCount: 301,
    isFeatured: true,
    benefits: oilBenefits,
    ingredients: ["100% Virgin Coconut Oil"],
    nutritionalInformation: [
      { label: "Energy", value: "862 kcal" },
      { label: "Fat", value: "100 g" },
      { label: "Saturated Fat", value: "86 g" },
    ],
    storage: "Store in a cool, dry place away from direct sunlight. May solidify below 24°C — this is natural.",
    origin: "Alappuzha, Kerala",
    traceability: traceCT24069B,
  },
  {
    categorySlug: "coconut-flour",
    name: "Coconut Flour",
    slug: "coconut-flour",
    sku: "CS-FLOUR-STD",
    shortDescription: "Sun-dried, finely milled, unsweetened.",
    description:
      "Unsweetened coconut flour, gently sun-dried and finely milled to lock in flavour — suited for baking, garnishing and traditional recipes.",
    price: 220,
    discountPrice: null,
    stockQuantity: 60,
    unit: "pack",
    sizes: ["250g", "500g"],
    tone: "cream" as const,
    rating: 4.4,
    reviewCount: 88,
    isFeatured: false,
    benefits: flourBenefits,
    ingredients: ["100% Coconut Flour"],
    nutritionalInformation: [
      { label: "Energy", value: "660 kcal" },
      { label: "Fat", value: "65 g" },
      { label: "Fibre", value: "16 g" },
    ],
    storage: "Store in an airtight container in a cool, dry place. Use within 4 months of opening.",
    origin: "Kozhikode, Kerala",
    traceability: traceUnavailable,
  },
  {
    categorySlug: "coconut-cream",
    name: "Coconut Cream",
    slug: "coconut-cream",
    sku: "CS-CREAM-STD",
    shortDescription: "Thick, rich, perfect for curries and desserts.",
    description:
      "Extra-thick coconut cream skimmed from the first press. No water added — for curries, whipped desserts and cooking that calls for richness.",
    price: 235,
    discountPrice: 210,
    stockQuantity: 45,
    unit: "bottle",
    sizes: ["400ml"],
    tone: "gold" as const,
    rating: 4.7,
    reviewCount: 64,
    isFeatured: false,
    benefits: creamBenefits,
    ingredients: ["Coconut Extract (92%)", "Water"],
    nutritionalInformation: [
      { label: "Energy", value: "330 kcal" },
      { label: "Fat", value: "34 g" },
    ],
    storage: "Refrigerate after opening, consume within 3 days.",
    origin: "Thrissur, Kerala",
    traceability: traceCT24082A,
  },
  {
    categorySlug: "coconut-water",
    name: "Coconut Water 6-Pack",
    slug: "coconut-water-6-pack",
    sku: "CS-WATER-6PK",
    shortDescription: "Six 330ml packs, ready to grab and go.",
    description: "Six single-serve 330ml packs of naturally sweet tender coconut water — a week's supply in one carton.",
    price: 660,
    discountPrice: 600,
    stockQuantity: 30,
    unit: "carton",
    sizes: ["330ml x6"],
    tone: "leaf" as const,
    rating: 4.6,
    reviewCount: 90,
    isFeatured: false,
    benefits: waterBenefits,
    ingredients: ["100% Tender Coconut Water"],
    nutritionalInformation: waterNutrition,
    storage: "Refrigerate after opening. Consume within 24 hours of opening each pack.",
    origin: "Pollachi, Tamil Nadu",
    traceability: traceCT24081A,
  },
  {
    categorySlug: "coconut-oil",
    name: "Coconut Oil 1L",
    slug: "coconut-oil-family-pack",
    sku: "CS-OIL-1L",
    shortDescription: "Family-size cold-pressed virgin coconut oil.",
    description: "Our signature cold-pressed virgin coconut oil in a family-size 1L bottle — for daily cooking, hair and skin.",
    price: 1280,
    discountPrice: 1150,
    stockQuantity: 25,
    unit: "bottle",
    sizes: ["1L"],
    tone: "gold" as const,
    rating: 4.6,
    reviewCount: 112,
    isFeatured: false,
    benefits: oilBenefits,
    ingredients: ["100% Virgin Coconut Oil"],
    nutritionalInformation: [{ label: "Energy", value: "862 kcal" }],
    storage: "Store in a cool, dry place.",
    origin: "Alappuzha, Kerala",
    traceability: traceCT24069B,
  },
  {
    categorySlug: "coconut-water",
    name: "Mature Coconut Water",
    slug: "mature-coconut-water",
    sku: "CS-WATER-MATURE",
    shortDescription: "Bolder, less sweet — for the daily-drinker.",
    description: "A bolder, more mineral-forward coconut water from slightly matured coconuts, for those who prefer less sweetness.",
    price: 110,
    discountPrice: null,
    stockQuantity: 0,
    unit: "bottle",
    sizes: ["500ml"],
    tone: "leaf" as const,
    rating: 4.2,
    reviewCount: 41,
    isFeatured: false,
    benefits: waterBenefits,
    ingredients: ["100% Mature Coconut Water"],
    nutritionalInformation: [
      { label: "Energy", value: "19 kcal" },
      { label: "Potassium", value: "250 mg" },
    ],
    storage: "Refrigerate after opening.",
    origin: "Pollachi, Tamil Nadu",
    traceability: traceUnavailable,
  },
  {
    categorySlug: "coconut-milk",
    name: "Coconut Milk Powder",
    slug: "coconut-milk-powder",
    sku: "CS-MILK-POWDER",
    shortDescription: "Instant coconut milk powder for cooking & baking.",
    description:
      "Spray-dried coconut milk powder — reconstitute with warm water, or use directly in baking and curries for a long shelf-life alternative.",
    price: 220,
    discountPrice: null,
    stockQuantity: 50,
    unit: "pack",
    sizes: ["250g", "500g"],
    tone: "cream" as const,
    rating: 4.4,
    reviewCount: 29,
    isFeatured: false,
    benefits: milkBenefits,
    ingredients: ["Coconut Milk Solids"],
    nutritionalInformation: [{ label: "Energy", value: "600 kcal" }],
    storage: "Store in an airtight container, away from moisture.",
    origin: "Thrissur, Kerala",
    traceability: traceUnavailable,
  },
];

async function main() {
  console.log("Seeding categories...");
  const categoryIdBySlug = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, tone: c.tone },
      create: c,
    });
    categoryIdBySlug.set(c.slug, row.id);
  }

  console.log("Seeding products...");
  const productIdBySlug = new Map<string, string>();
  for (const p of products) {
    const { categorySlug, ...data } = p;
    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${categorySlug}`);
    const row = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...data, ...productMedia[data.slug], categoryId },
      create: { ...data, ...productMedia[data.slug], categoryId },
    });
    productIdBySlug.set(p.slug, row.id);
  }

  console.log("Seeding users...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cocosmart.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "CocoSmart Admin",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "ADMIN",
    },
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: "tarun@example.com" },
    update: {},
    create: {
      name: "Tarun Sharma",
      email: "tarun@example.com",
      passwordHash: await hashPassword("Customer123!"),
      role: "CUSTOMER",
      phone: "9876543210",
    },
  });

  console.log("Seeding a demo address + order for the demo customer...");
  const existingAddress = await prisma.address.findFirst({ where: { userId: demoCustomer.id } });
  const address =
    existingAddress ??
    (await prisma.address.create({
      data: {
        userId: demoCustomer.id,
        fullName: "Tarun Sharma",
        phone: "9876543210",
        addressLine1: "221B Palm Grove Road",
        city: "Hyderabad",
        state: "Telangana",
        postalCode: "500081",
        country: "India",
        isDefault: true,
      },
    }));

  const hasOrder = await prisma.order.findFirst({ where: { userId: demoCustomer.id } });
  if (!hasOrder) {
    const waterId = productIdBySlug.get("tender-coconut-water")!;
    const oilId = productIdBySlug.get("virgin-coconut-oil")!;
    await prisma.order.create({
      data: {
        userId: demoCustomer.id,
        orderNumber: generateOrderNumber(),
        subtotal: 460,
        discount: 60,
        shippingCost: 0,
        tax: 0,
        totalAmount: 460,
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        addressId: address.id,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
        items: {
          createMany: {
            data: [
              { productId: waterId, productName: "Tender Coconut Water", size: "330ml", price: 120, quantity: 1, total: 120 },
              { productId: oilId, productName: "Virgin Coconut Oil", size: "250ml", price: 340, quantity: 1, total: 340 },
            ],
          },
        },
      },
    });
  }

  console.log("\nSeed complete.");
  console.log(`Admin login:    ${adminEmail} / ${adminPassword}`);
  console.log(`Customer login: tarun@example.com / Customer123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
