import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { checkoutSchema, orderListQuerySchema } from "../validators/orderValidators";
import { idParamSchema } from "../validators/productValidators";

export const orderRoutes = Router();
orderRoutes.use(authenticate);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Checkout — turns the current cart into an order
 *     description: >
 *       Runs as a single database transaction. Prices, stock and totals are
 *       always read fresh from the database inside the transaction — the
 *       client only supplies the delivery address and payment method.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Order created }
 *       400: { description: Cart empty or a product is no longer available }
 *       409: { description: Insufficient stock for one or more items }
 *   get:
 *     tags: [Orders]
 *     summary: List the current user's orders
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated order list }
 */
orderRoutes.post("/", validate({ body: checkoutSchema }), orderController.checkout);
orderRoutes.get("/", validate({ query: orderListQuerySchema }), orderController.listMine);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get one of the current user's orders by id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Order detail }
 *       404: { description: Not found (also returned if it belongs to another user) }
 */
orderRoutes.get("/:id", validate({ params: idParamSchema }), orderController.getMine);
