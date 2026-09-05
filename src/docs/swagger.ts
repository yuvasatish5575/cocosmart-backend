import swaggerJsdoc from "swagger-jsdoc";
import path from "node:path";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "CocoSmart API",
      version: "1.0.0",
      description:
        "REST API for the CocoSmart coconut-products e-commerce platform: catalogue, cart, checkout/orders, and admin management.",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        ApiErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object" },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../routes/*.ts").split(path.sep).join("/"),
    path.join(__dirname, "../routes/*.js").split(path.sep).join("/"),
  ],
});
