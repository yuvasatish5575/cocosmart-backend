import { Router } from "express";
import { cartController } from "../controllers/cartController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { addCartItemSchema, cartItemParamSchema, updateCartItemSchema } from "../validators/cartValidators";

export const cartRoutes = Router();
cartRoutes.use(authenticate);

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current user's cart, with server-computed totals
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cart contents and totals }
 *   delete:
 *     tags: [Cart]
 *     summary: Empty the cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cart cleared }
 */
cartRoutes.get("/", cartController.getCart);
cartRoutes.delete("/", cartController.clear);

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add a product/size to the cart
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, size]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               size: { type: string }
 *               quantity: { type: integer, default: 1 }
 *     responses:
 *       200: { description: Updated cart }
 *       409: { description: Insufficient stock }
 */
cartRoutes.post("/items", validate({ body: addCartItemSchema }), cartController.addItem);

/**
 * @openapi
 * /api/cart/items/{id}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update a cart line's quantity (0 removes it)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated cart }
 *   delete:
 *     tags: [Cart]
 *     summary: Remove a cart line
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated cart }
 */
cartRoutes.patch("/items/:id", validate({ params: cartItemParamSchema, body: updateCartItemSchema }), cartController.updateItem);
cartRoutes.delete("/items/:id", validate({ params: cartItemParamSchema }), cartController.removeItem);
