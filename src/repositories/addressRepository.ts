import { AddressModel, type AddressDoc } from "../models/Address";

type AddressData = Pick<
  AddressDoc,
  "fullName" | "phone" | "addressLine1" | "city" | "state" | "postalCode"
> &
  Partial<Pick<AddressDoc, "addressLine2" | "country" | "isDefault">>;

export const addressRepository = {
  listForUser(userId: string) {
    return AddressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  },
  findById(id: string) {
    return AddressModel.findById(id).lean();
  },
  create(userId: string, data: AddressData) {
    return AddressModel.create({ ...data, userId }).then((doc) => doc.toObject());
  },
  update(id: string, data: Partial<AddressData>) {
    return AddressModel.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  delete(id: string) {
    return AddressModel.findByIdAndDelete(id);
  },
  clearDefaultForUser(userId: string) {
    return AddressModel.updateMany({ userId, isDefault: true }, { isDefault: false });
  },
};
