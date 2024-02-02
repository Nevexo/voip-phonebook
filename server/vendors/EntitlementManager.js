// voip-phonebook - Entitlement Manager
// This module manages the entitlements for vendor services.
// (c) Cameron Fleming 2023.

import { logger } from "../index";

import { get_site } from "../site/SiteManage";
import { get_service_by_id } from "./VendorManager";
import { get_phonebook_fields_for_site } from "../fields/PhonebookFieldManager";
import { VendorServiceEntitlement } from "../types/VendorServiceEntitlement";

export const get_entitlements = async () => {
  return await VendorServiceEntitlement.find();
}

export const get_entitlement_by_id = async (id) => {
  return await VendorServiceEntitlement.findOne({ id: id });
}

export const get_entitlement_for_vendor = async (vendor_service_id) => {
  const vendor_service = await get_service_by_id(vendor_service_id);
  if (!vendor_service) return undefined;

  return await VendorServiceEntitlement.find({ vendor_service: vendor_service });
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

  const site = await get_site(site_id);
  if (!site) return { error: "site_does_not_exist" };

  const site_fields = await get_phonebook_fields_for_site(site_id);

  const existing_entitlement = await VendorServiceEntitlement.findOne({ site: site, vendor_service: vendor_service });
  if (existing_entitlement) return { error: "entitlement_already_exists" };

  // Field mapping is expected to be:
  // { "site_field": "vendor_field" }

  // Ensure field mapping is correct
  // Check all site requested fields are present in the field_mapping
  for (const field of site_fields) {
    if (!field.required) continue;
    if (!field_mapping[field.id]) return { error: "required_field_missing", message: `Field ${field.name} is required for this site.` };
  }

  // Check all specified mappings are valid against this site
  for (const field in field_mapping) {
    if (!site_fields.some(f => f.id === field)) return { error: "invalid_field_mapping", message: `Field ${field} is not valid for this site.` };
  }

  // Check all specified mappings are valid against this vendor service.
  for (const field in field_mapping) {
    if (!vendor_service.supported_fields.some(f => f.name === field_mapping[field])) return { error: "invalid_field_mapping", message: `Field ${field_mapping[field]} is not valid for this vendor service.` };
  }

  const entitlement = new VendorServiceEntitlement({
    site: site,
    vendor_service: vendor_service,
    configuration: configuration,
    field_mapping: field_mapping,
  });

  await entitlement.save();
  logger.info(`create_entitlement: created entitlement ${entitlement.id} for site ${site_id} and service ${vendor_service_id}`)
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
  logger.info(`update_entitlement_status: updated entitlement ${entitlement.id} for site ${entitlement.site} and service ${entitlement.vendor_service} status to ${status}`)
  return entitlement;
}

export const delete_entitlement = async (entitlement_id) => {
  // Check a service with this name doesn't already exist.
  const entitlement = await get_entitlement_by_id(entitlement_id);
  if (!entitlement) return { error: "entitlement_does_not_exist" };

  logger.info(`delete_entitlement: deleted entitlement ${entitlement.id} for site ${entitlement.site} and service ${entitlement.vendor_service}`)
  await VendorServiceEntitlement.deleteOne({ id: entitlement.id })
  return entitlement;
}

export const get_entitlement_by_access_key = async (access_key) => {
  return await VendorServiceEntitlement.findOne({ access_key: access_key });
}