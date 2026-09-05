import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { productRoutes } from "./productRoutes";
import { categoryRoutes } from "./categoryRoutes";
import { cartRoutes } from "./cartRoutes";
import { addressRoutes } from "./addressRoutes";
import { orderRoutes } from "./orderRoutes";
import { wishlistRoutes } from "./wishlistRoutes";
import { adminRoutes } from "./adminRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/products", productRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/cart", cartRoutes);
apiRouter.use("/addresses", addressRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/wishlist", wishlistRoutes);
apiRouter.use("/admin", adminRoutes);
