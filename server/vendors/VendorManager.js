// voip-provision - Vendor Service methods
// These methods are used to create/update/delete vendor services within the database.
// (c) Cameron Fleming 2021.

import { logger } from "../index";

import { VendorService } from "../types/VendorService";

export const get_services = async () => {
  return await VendorService.find();
}

export const get_service_by_id = async (id) => {
  return await VendorService.findOne({ id: id });
}

export const get_service_by_name = async (name) => {
  return await VendorService.findOne({ name: name });
}

export const create_service = async (name, friendly_name, supported_fields, version) => {
  // Check a service with this name doesn't already exist.
  const existing_service = await VendorService.findOne({ name: name });
  if (existing_service) return { error: "service_already_exists" };

  const service = new VendorService({
    name: name,
    friendly_name: friendly_name,
    supported_fields: supported_fields,
    version: version,
  });

  await service.save();
  logger.info(`create_service: created service ${service.id} (${service.name})`)
  return service;
}

export const update_service = async (name, friendly_name, supported_fields, version) => {
  // Check a service with this name doesn't already exist.
  const existing_service = await VendorService.findOne({ name: name });
  if (!existing_service) return { error: "service_does_not_exist" };

  existing_service.friendly_name = friendly_name;
  existing_service.supported_fields = supported_fields;
  existing_service.version = version;

  await existing_service.save();
  logger.info(`update_service: updated service ${existing_service.id} (${existing_service.name}) version ${existing_service.version}`)
  return existing_service;
}

export const delete_service = async (name) => {
  // Check a service with this name doesn't already exist.
  const existing_service = await VendorService.findOne({ name: name });
  if (!existing_service) return { error: "service_does_not_exist" };

  logger.info(`delete_service: deleted service ${existing_service.id} (${existing_service.name})`)
  await VendorService.deleteOne({ id: existing_service.id })
  return existing_service;
}