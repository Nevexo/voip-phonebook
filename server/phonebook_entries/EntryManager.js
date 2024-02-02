// voip-phonebook - Phonebook entry management methods
// This file contains methods for managing phonebook entries, rows and columns.
// (c) Cameron Fleming 2023.

import { PhonebookRow } from "../types/PhonebookEntry";

import { logger } from "../index";
import { get_user } from "../auth/Users";
import { get_phonebook } from "../phonebook/BookManage";
import { get_phonebook_field, get_phonebook_fields_for_site } from "../fields/PhonebookFieldManager";

export const get_phonebook_entry = async (id) => {
  // Get a full row from the entry, resolved to columns, phonebook and user.

  const entry = await PhonebookRow.findOne({ id: id })
    .populate("fields")
    .populate("phonebook_container")
    .populate("created_by")
    .populate("fields.field");

  if (!entry) return undefined;
  return entry;
}

export const get_phonebook_entries = async (phonebook_id) => {
  // Get all entries in a phonebook
  const phonebook = await get_phonebook(phonebook_id);
  if (!phonebook) return { error: "phonebook_does_not_exist", phonebook: phonebook_id };

  const entries = await PhonebookRow.find({ phonebook_container: phonebook })
    .populate("fields")
    .populate("phonebook_container")
    .populate("created_by")
    .populate("fields.field");

  return entries;
}

export const create_phonebook_entry = async (phonebook_id, created_by, fields) => {
  // Create a new entry, check the fields from the site, and any that are required
  // must be defined in fields before accepting the new entry.
  // Any invalid fields should throw an error.

  // Field is expected to be {"field_id": "valid field ID from phonebookfields", "value": "string"}

  // Verify the phonebook exists
  const phonebook = await get_phonebook(phonebook_id);
  if (!phonebook) return { error: "phonebook_does_not_exist", phonebook: phonebook_id };

  const site = phonebook.site;

  // Verify the user exists
  const user = await get_user(created_by);
  if (!user) return { error: "user_does_not_exist", user: created_by };

  // Verify the fields exist
  const fields_object = [];
  for (const field of fields) {
    const field_object = await get_phonebook_field(field.field_id);
    if (!field_object) {
      logger.warn(`create_phonebook_entry: check fields: field ${field.field_id} does not exist!`);
      return { error: "field_does_not_exist", message: `invalid field: ${field.field_id}` };
    }
    fields_object.push(field);
  }

  // Verify all required fields are present
  const required_fields = await get_phonebook_fields_for_site(site.id);
  for (const field of required_fields) {
    if (field.required && !fields_object.some(f => f.field_id === field.id)) {
      logger.warn(`create_phonebook_entry: check fields: required field ${field.id} (${field.name}) is missing!`);
      return { error: "required_field_missing", message: `missing field: ${field.id} (${field.name})` };
    }
  }

  logger.debug(`create_phonebook_entry: creating entry for phonebook ${phonebook.id} (${phonebook.name})`)

  // Create the column objects, these are not kept in the database
  const columns = [];
  for (const field of fields_object) {
    columns.push({
      field: await get_phonebook_field(field.field_id), // TODO: this is wasteful, two lookups for the same thing.
      value: field.value,
    });
  }

  // Create the entry
  const entry = new PhonebookRow({
    fields: columns,
    phonebook_container: phonebook,
    created_by: user,
  });

  await entry.save();
  logger.info(`create_phonebook_entry: created entry ${entry.id} for phonebook ${phonebook.id} (${phonebook.name})`)

  return entry;
}

export const update_phonebook_entry_field = async (entry_id, field_id, value) => {
  // Update a phonebook entry field
  const entry = await get_phonebook_entry(entry_id);
  if (!entry) return undefined;

  const field = await get_phonebook_field(field_id);
  if (!field) return undefined;

  const column = entry.fields.find(f => f.field.id === field.id);
  if (!column) return undefined;

  column.value = value;

  // Update the column in the entry and save the document
  entry.fields = entry.fields.map(f => {
    if (f.field.id === field.id) {
      return column;
    } else {
      return f;
    }
  });

  await entry.save();
  logger.debug(`update_phonebook_entry_field: updated entry field ${column.id} to entry ${entry.id} (${entry.phonebook_container.name})`)

  return column;
}

export const add_phonebook_entry_field = async (entry_id, field_id, value) => {
  // Add a new field to an entry
  const entry = await get_phonebook_entry(entry_id);
  if (!entry) return { error: "entry_does_not_exist", entry: entry_id };

  const field = await get_phonebook_field(field_id);
  if (!field) return { error: "field_does_not_exist", field: field_id };

  // Check the field doesn't already exist
  if (entry.fields.some(f => f.field.id === field.id)) {
    logger.warn(`add_phonebook_entry_field: check fields: field ${field.id} already exists in entry ${entry.id} (${entry.phonebook_container.name})`);
    return { error: "field_already_exists", field: field.id };
  }

  // Create the column
  const column = {
    field: field,
    value: value,
  };

  entry.fields.push(column);
  await entry.save();

  logger.info(`add_phonebook_entry_field: added field ${field.id} to entry ${entry.id} (${entry.phonebook_container.name})`)
  return column;
}

export const delete_phonebook_entry = async (entry_id) => {
  // Delete all columns and the entry itself
  const entry = await get_phonebook_entry(entry_id);
  if (!entry) return { "error": "phonebook_does_not_exist" };

  logger.info(`delete_phonebook_entry: deleting entry ${entry.id} (${entry.phonebook_container.name})`)

  await PhonebookRow.deleteOne({ id: entry.id });
  return { "success": true };
}