import type { ClientSession, PipelineStage } from "mongoose";
import { ProductModel, type ProductDoc } from "../models/Product";
import type { CategoryDoc } from "../models/Category";
import { escapeRegExp } from "../utils/regex";

/** The shape returned once `categoryId` has been populated. */
export type ProductWithCategory = Omit<ProductDoc, "categoryId"> & { categoryId: CategoryDoc };

export interface ProductListFilter {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  inStockOnly?: boolean;
  activeOnly: boolean;
  sort: "popularity" | "price_asc" | "price_desc" | "rating" | "newest";
  skip: number;
  take: number;
}

type ProductData = Omit<
  Pick<ProductDoc, "categoryId" | "name" | "slug" | "description" | "shortDescription" | "price" | "sku" | "stockQuantity" | "unit">,
  "categoryId"
> & { categoryId: string } & Partial<
    Pick<
      ProductDoc,
      | "discountPrice"
      | "sizes"
      | "image"
      | "images"
      | "tone"
      | "benefits"
      | "ingredients"
      | "nutritionalInformation"
      | "storage"
      | "origin"
      | "traceability"
      | "isFeatured"
      | "isActive"
    >
  >;

function sortStageFor(sort: ProductListFilter["sort"]): Record<string, 1 | -1> {
  switch (sort) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "rating":
      return { rating: -1 };
    case "newest":
      return { createdAt: -1 };
    default:
      return { isFeatured: -1, reviewCount: -1 };
  }
}

export const productRepository = {
  async list(filter: ProductListFilter) {
    const match: Record<string, unknown> = {};
    if (filter.activeOnly) match.isActive = true;
    if (filter.featured) match.isFeatured = true;
    if (filter.inStockOnly) match.stockQuantity = { $gt: 0 };
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      match.price = {
        ...(filter.minPrice !== undefined ? { $gte: filter.minPrice } : {}),
        ...(filter.maxPrice !== undefined ? { $lte: filter.maxPrice } : {}),
      };
    }

    // The joined category replaces `categoryId` (rather than landing in a
    // separate `category` field) so aggregation results have the same shape
    // as every other method here that does `.populate("categoryId")`.
    const pipeline: PipelineStage[] = [
      { $match: match },
      { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "categoryId" } },
      { $unwind: "$categoryId" },
    ];

    if (filter.categorySlug) {
      pipeline.push({ $match: { "categoryId.slug": filter.categorySlug } });
    }

    if (filter.search) {
      const re = new RegExp(escapeRegExp(filter.search), "i");
      pipeline.push({ $match: { $or: [{ name: re }, { shortDescription: re }, { "categoryId.name": re }] } });
    }

    pipeline.push(
      { $sort: sortStageFor(filter.sort) },
      {
        $facet: {
          data: [{ $skip: filter.skip }, { $limit: filter.take }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const [result] = await ProductModel.aggregate(pipeline);
    const rows: ProductWithCategory[] = result?.data ?? [];
    const total: number = result?.totalCount?.[0]?.count ?? 0;
    return [rows, total] as const;
  },

  findById(id: string, session?: ClientSession) {
    return ProductModel.findById(id).populate<{ categoryId: CategoryDoc }>("categoryId").session(session ?? null).lean();
  },

  findBySlug(slug: string) {
    return ProductModel.findOne({ slug }).populate<{ categoryId: CategoryDoc }>("categoryId").lean();
  },

  async create(data: ProductData): Promise<ProductWithCategory> {
    const doc = await ProductModel.create(data);
    await doc.populate("categoryId");
    return doc.toObject() as unknown as ProductWithCategory;
  },

  update(id: string, data: Partial<ProductData>, session?: ClientSession) {
    return ProductModel.findByIdAndUpdate(id, data, { new: true, session })
      .populate<{ categoryId: CategoryDoc }>("categoryId")
      .lean();
  },

  decrementStock(id: string, byQuantity: number, session?: ClientSession) {
    return ProductModel.findByIdAndUpdate(id, { $inc: { stockQuantity: -byQuantity } }, { session });
  },

  /**
   * Atomic "decrement only if enough stock" — the availability check and the
   * write happen as one update, so two concurrent checkouts for the last
   * unit can't both pass a check done as a separate earlier read and then
   * both decrement past zero. Returns whether the update matched: false
   * means insufficient stock.
   */
  async decrementStockIfAvailable(id: string, byQuantity: number, session?: ClientSession) {
    const result = await ProductModel.updateOne(
      { _id: id, stockQuantity: { $gte: byQuantity } },
      { $inc: { stockQuantity: -byQuantity } },
      { session }
    );
    return result.matchedCount > 0;
  },

  delete(id: string) {
    return ProductModel.findByIdAndDelete(id);
  },

  lowStock(threshold: number, take = 10) {
    return ProductModel.find({ isActive: true, stockQuantity: { $lte: threshold } })
      .sort({ stockQuantity: 1 })
      .limit(take)
      .populate<{ categoryId: CategoryDoc }>("categoryId")
      .lean();
  },

  count(where?: Record<string, unknown>) {
    return ProductModel.countDocuments(where ?? {});
  },
};
