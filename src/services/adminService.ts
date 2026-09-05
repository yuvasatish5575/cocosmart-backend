import { orderRepository } from "../repositories/orderRepository";
import { productRepository } from "../repositories/productRepository";
import { userRepository } from "../repositories/userRepository";
import { LOW_STOCK_THRESHOLD } from "../utils/productPresentation";
import { toOrderSummary, toPublicProduct } from "../utils/presenters";

export const adminService = {
  async dashboard() {
    const [revenue, totalOrders, pendingOrders, deliveredOrders, totalCustomers, totalProducts, lowStock, recentOrders] =
      await Promise.all([
        orderRepository.aggregateRevenue(),
        orderRepository.count(),
        orderRepository.countByStatus("PENDING"),
        orderRepository.countByStatus("DELIVERED"),
        userRepository.count(),
        productRepository.count({ isActive: true }),
        productRepository.lowStock(LOW_STOCK_THRESHOLD),
        orderRepository.recentForDashboard(5),
      ]);

    return {
      totalRevenue: revenue,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts: lowStock.map(toPublicProduct),
      recentOrders: recentOrders.map(toOrderSummary),
    };
  },
};
