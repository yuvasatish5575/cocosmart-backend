import { addressRepository } from "../repositories/addressRepository";
import { ApiError } from "../utils/ApiError";
import type { AddressInput, UpdateAddressInput } from "../types/dto";

export const addressService = {
  list(userId: string) {
    return addressRepository.listForUser(userId);
  },

  async create(userId: string, input: AddressInput) {
    if (input.isDefault) {
      await addressRepository.clearDefaultForUser(userId);
    }
    return addressRepository.create({ ...input, user: { connect: { id: userId } } });
  },

  async update(userId: string, addressId: string, input: UpdateAddressInput) {
    const existing = await addressRepository.findById(addressId);
    if (!existing || existing.userId !== userId) throw ApiError.notFound("Address not found");
    if (input.isDefault) {
      await addressRepository.clearDefaultForUser(userId);
    }
    return addressRepository.update(addressId, input);
  },

  async remove(userId: string, addressId: string) {
    const existing = await addressRepository.findById(addressId);
    if (!existing || existing.userId !== userId) throw ApiError.notFound("Address not found");
    await addressRepository.delete(addressId);
  },
};
