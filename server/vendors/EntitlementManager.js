// voip-phonebook - Entitlement Manager
// This module manages the entitlements for vendor services.
// (c) Cameron Fleming 2023.

import { logger } from "../index";

import { get_site } from "../site/SiteManage";
import { get_service_by_id } from "./VendorManager";
import { get_phonebook_fields_for_site } from "../fields/PhonebookFieldManager";
import { VendorServiceEntitlement } from "../types/VendorServiceEntitlement";
import { send_entitlement_to_vendor, revoke_entitlement_from_vendor } from "./VendorSocket";

import { nanoid } from 'nanoid';

export const get_entitlements = async () => {
  return await VendorServiceEntitlement.find().populate("vendor_service").populate("site");
}

export const get_entitlement_by_id = async (id) => {
  return await VendorServiceEntitlement.findOne({ id: id }).populate("vendor_service").populate("site");
}

export const get_entitlement_for_vendor = async (vendor_service_id) => {
  const vendor_service = await get_service_by_id(vendor_service_id);
  if (!vendor_service) return undefined;

  return await VendorServiceEntitlement.find({ vendor_service: vendor_service }).populate("vendor_service").populate("site");
}

export const get_entitlements_for_site = async (site_id) => {
  const site = await get_site(site_id);
  if (!site) return {error: "site_does_not_exist"};

  return await VendorServiceEntitlement.find({ site: site }).populate("vendor_service").populate("site");
}

export const create_entitlement = async (site_id, vendor_service_id, configuration, field_mapping) => {
  // Check a service with this name doesn't already exist.
  const vendor_service = await get_service_by_id(vendor_service_id);
  if (!vendor_service) return { error: "service_does_not_exist" };

  // Drop out of the service isn't connected, as provisioning must happen immediately.
  if (vendor_service.status !== "available") return { 
    error: "service_not_available",
    message: "The chosen vendor service is not currently online. Entitlements can only be created for available services."
  };

  const site = await get_site(site_id);
  if (!site) return { error: "site_does_not_exist" };

  const site_fields = await get_phonebook_fields_for_site(site_id);

  const existing_entitlement = await VendorServiceEntitlement.findOne({ site: site, vendor_service: vendor_service });
  if (existing_entitlement) return { error: "entitlement_already_exists" };

  // Field mapping is expected to be:
  // { "vendor_field": "site_field" }
  // i.e., "phone_number": "vendor_abc123"

  // Ensure field mapping is correct
  // Check all site requested fields are present in the field_mapping
  for (const field of site_fields) {
    if (!field.required) continue;
    // Check if any of the values of field_mapping contain this ID in the value.
    if (!Object.values(field_mapping).includes(field.id)) return { error: "missing_field_mapping", message: `Field ${field.id} is required for this site.` };
  }

  // Check all vendor required fields are present in the field_mapping
  for (const field of vendor_service.supported_fields) {
    if (!field.required) continue;
    if (!Object.keys(field_mapping).includes(field.name)) return { error: "missing_field_mapping", message: `Field ${field.name} is required for this vendor service.` };
  }

  // Check all specified mappings are valid against this site
  for (const field in field_mapping) {
    if (!site_fields.some(f => f.id === field_mapping[field])) return { error: "invalid_field_mapping", message: `Field ${field_mapping[field]} is not valid for this site.` };
  }

  // Check all specified mappings are valid against this vendor service.
  for (const field in field_mapping) {
    if (!vendor_service.supported_fields.some(f => f.name === field)) return { error: "invalid_field_mapping", message: `Field ${field} is not valid for this vendor service.` };
  }

  // Generate access key
  const access_key = nanoid(64);

  const entitlement = new VendorServiceEntitlement({
    site: site,
    vendor_service: vendor_service,
    configuration: configuration,
    field_mapping: field_mapping,
    access_key: access_key,
  });

  await entitlement.save();
  logger.info(`create_entitlement: created entitlement ${entitlement.id} for site ${site_id} and service ${vendor_service_id}`)

  // Send the entitlement to the vendor service immediately.
  // Re-resolve entitlement to ensure populated fields are available.
  await send_entitlement_to_vendor(await get_entitlement_by_id(entitlement.id));

  return entitlement;
}

export const update_entitlement = async (entitlement_id, configuration, field_mapping) => {
  // Check a service with this name doesn't already exist.
  const entitlement = await get_entitlement_by_id(entitlement_id);
  if (!entitlement) return { error: "entitlement_does_not_exist" };

  entitlement.configuration = configuration;
  entitlement.field_mapping = field_mapping;

  await entitlement.save();
  logger.info(`update_entitlement: updated entitlement ${entitlement.id} for site ${entitlement.site} and service ${entitlement.vendor_service}`)
  return entitlement;
}

export const update_entitlement_status = async (entitlement_id, status) => {
  // TODO: emit event.
  // Check a service with this name doesn't already exist.
  const entitlement = await get_entitlement_by_id(entitlement_id);
  if (!entitlement) return { error: "entitlement_does_not_exist" };

  const valid_statuses = ["invalid", "paused", "available"];
  if (!valid_statuses.includes(status)) return { error: "invalid_status" };

  entitlement.entitlement_status = status;

  await entitlement.save();
  logger.info(`update_entitlement_status: updated entitlement ${entitlement.id} for site ${entitlement.site.name} and service ${entitlement.vendor_service.name} status to ${status}`)
  return entitlement;
}

export const delete_entitlement = async (entitlement_id) => {
  // Check a service with this name doesn't already exist.
  const entitlement = await get_entitlement_by_id(entitlement_id);
  if (!entitlement) return { error: "entitlement_does_not_exist" };

  // Revoke the entitlement from any running vendor service instances
  await revoke_entitlement_from_vendor(entitlement);

  logger.info(`delete_entitlement: deleted entitlement ${entitlement.id} for site ${entitlement.site.name} and service ${entitlement.vendor_service.name}`)
  await VendorServiceEntitlement.deleteOne({ id: entitlement.id })
  return entitlement;
}

export const get_entitlement_by_access_key = async (access_key) => {
  return await VendorServiceEntitlement.findOne({ access_key: access_key }).populate("vendor_service").populate("site");
}

export const pause_entitlement = async (entitlement_id) => {
  // Pause an enabled entitlement.
  // Revoke it from any running vendor services
  // and set the status to paused.

  await revoke_entitlement_from_vendor(entitlement_id);
  return await update_entitlement_status(entitlement_id, "paused");
}

export const resume_entitlement = async (entitlement_id) => {
  // Resume a paused entitlement, by setting it to setup mode and
  // then sending it for approval.
  const entitlement = await get_entitlement_by_id(entitlement_id);
  if (!entitlement) return { error: "entitlement_does_not_exist" };

  logger.info(`resume_entitlement: resuming entitlement ${entitlement.id} for site ${entitlement.site.name} and service ${entitlement.vendor_service.name}`)

  await update_entitlement_status(entitlement_id, "setup");
  await send_entitlement_to_vendor(entitlement);
  return true;
}

export const update_entitlement_metadata = async (entitlement_id, metadata) => {
  // Update the metadata for an entitlement.
  const entitlement = await get_entitlement_by_id(entitlement_id);
  if (!entitlement) return { error: "entitlement_does_not_exist" };

  entitlement.metadata = metadata;
  await entitlement.save();

  return entitlement;
}

export const rotate_access_key = async (entitlement_id) => {
  // Rotate the access key for an entitlement.
  const entitlement = await get_entitlement_by_id(entitlement_id);
  if (!entitlement) return { error: "entitlement_does_not_exist" };

  entitlement.access_key = nanoid(64);
  await entitlement.save();

  return entitlement;
}