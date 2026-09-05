import { Router } from "express";
import { wishlistController } from "../controllers/wishlistController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { objectId } from "../validators/common";

export const wishlistRoutes = Router();
wishlistRoutes.use(authenticate);

wishlistRoutes.get("/", wishlistController.list);
wishlistRoutes.post("/", validate({ body: z.object({ productId: objectId }) }), wishlistController.add);
wishlistRoutes.delete("/:productId", validate({ params: z.object({ productId: objectId }) }), wishlistController.remove);
