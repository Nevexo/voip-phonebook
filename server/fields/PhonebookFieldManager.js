// voip-phonebook - Site Phonebook Field Manager
// (c) Cameron Fleming 2023.

import { PhonebookField } from "../types/PhonebookField";

import { logger } from "../index";
import { get_site } from "../site/SiteManage";

export const get_phonebook_field = async (id) => {
  // Get a specific phonebook field by it's ID
  const field = PhonebookField.findOne({ id: id }).populate("site");

  if (!field) return undefined;
  return field;
}

export const get_phonebook_fields_for_site = async (site_id) => {
  // Get all phonebook fields for a site
  const site = await get_site(site_id);
  if (!site) return undefined;

  const fields = await PhonebookField.find({ site: site }).populate("site");
  return fields;
}

export const create_phonebook_field = async (site_id, name, type, required, system) => {
  // Create a new phonebook field
  // site_id must be resolved.

  // Verify site exists
  const site = await get_site(site_id);
  if (!site) {
    logger.warn(`create_phonebook_field: check site: site ${site_id} does not exist!`);
    return { error: "site_does_not_exist", site: site_id };
  }

  // Check the type is valid
  const types = PhonebookField.schema.path("type").enumValues;
  if (!types.includes(type)) {
    logger.warn(`create_phonebook_field: check type: type ${type} is not valid!`);
    return { error: "type_is_not_valid", type: type };
  }

  // Check a field with this name does not already exist
  if (await PhonebookField.findOne({ site: site, name: name })) {
    logger.warn(`create_phonebook_field: check name: field ${name} already exists!`);
    return { error: "field_already_exists", field: name };
  }

  const field = new PhonebookField({
    site: site,
    name: name,
    type: type,
    required: required,
    created_by_system: system || false
  });

  logger.info(`create_phonebook_field: created phonebook field ${field.id} (${field.name}) for site ${site.id} (${site.name})`)

  await field.save();
  return field;
}

export const delete_phonebook_field = async (id) => {
  // TODO: Ensure no phonebook entries are using the field, if they are, drop them.
  // Delete a phonebook field
  const field = await get_phonebook_field(id);
  if (!field) {
    logger.warn(`delete_phonebook_field: check field: field ${id} does not exist!`);
    return { error: "field_does_not_exist", field: id };
  }
  
  if (field.created_by_system) {
    logger.warn(`delete_phonebook_field: check field: field ${id} (${field.name}) was created by the system and cannot be deleted!`);
    return { error: "field_created_by_system, cannot delete" };
  }

  logger.info(`delete_phonebook_field: deleted phonebook field ${field.id} (${field.name})`);

  await PhonebookField.deleteOne({ id: id });
  return true;
}