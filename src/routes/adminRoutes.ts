import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { orderController } from "../controllers/orderController";
import { productController } from "../controllers/productController";
import { validate } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import { orderListQuerySchema, updateOrderStatusSchema } from "../validators/orderValidators";
import { idParamSchema, productListQuerySchema } from "../validators/productValidators";

export const adminRoutes = Router();
adminRoutes.use(authenticate, authorize("ADMIN"));

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Aggregate store statistics (revenue, orders, customers, low stock, recent orders)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard statistics }
 */
adminRoutes.get("/dashboard", adminController.dashboard);
adminRoutes.get("/analytics", adminController.dashboard);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List customer accounts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated customer list }
 */
adminRoutes.get("/users", adminController.listUsers);

/**
 * @openapi
 * /admin/activity:
 *   get:
 *     tags: [Admin]
 *     summary: Audit log of admin actions (who created/updated/removed what)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated activity log }
 */
adminRoutes.get("/activity", adminController.activity);

adminRoutes.get("/products", validate({ query: productListQuerySchema }), productController.listAdmin);

/**
 * @openapi
 * /admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: List all orders across every customer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED] }
 *     responses:
 *       200: { description: Paginated order list }
 */
adminRoutes.get("/orders", validate({ query: orderListQuerySchema }), orderController.listAll);
adminRoutes.get("/orders/:id", validate({ params: idParamSchema }), orderController.getAny);

/**
 * @openapi
 * /admin/orders/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update an order's fulfilment status
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderStatus]
 *             properties:
 *               orderStatus: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED] }
 *     responses:
 *       200: { description: Order updated }
 */
adminRoutes.patch(
  "/orders/:id/status",
  validate({ params: idParamSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus
);
