// voip-phonebook - Phonebook Entry Management Endpoints
// These endpoints are used to create, update, and delete phonebook entries.
// Endpoints are stored in rows and columns, but are resolved by EntryManager.
// These endpoints live downstream of phonebooks, so authentication is handled by sites.
// Full URL: /site/id/phonebook/id/entry/...
// (c) Cameron Fleming 2023.

import { Router } from "express";

import {
  get_phonebook_entry,
  get_phonebook_entries,
  create_phonebook_entry,
  update_phonebook_entry_field,
  add_phonebook_entry_field,
  delete_phonebook_entry,
} from "../phonebook_entries/EntryManager.js";

export const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  // List all phonebook entries for this phonebook.
  const entries = await get_phonebook_entries(req.params.phonebook_id);

  if (!entries) {
    return res.status(200).json([]);
  }

  let public_entries = [];
  for (const entry of entries) {
    public_entries.push({
      id: entry.id,
      fields: entry.fields,
      created_at: entry.created_at,
      created_by: {
        id: entry.created_by.id,
        username: entry.created_by.username,
        name: entry.created_by.name,
        email: entry.created_by.email,
      },
    })
  }

  return res.status(200).json(public_entries);
});

router.get("/:entry_id", async (req, res) => {
  // Get a specific phonebook entry
  const entry = await get_phonebook_entry(req.params.entry_id);

  if (!entry) {
    return res.status(404).json({ error: "entry_does_not_exist" });
  }

  return res.status(200).json({
    id: entry.id,
    fields: entry.fields,
    created_at: entry.created_at,
    created_by: {
      id: entry.created_by.id,
      username: entry.created_by.username,
      name: entry.created_by.name,
      email: entry.created_by.email,
    },
  });
});

router.post("/", async (req, res) => {
  // Create a new phonebook entry
  // Fields are expected to be {"field_id": "valid field ID from phonebookfields", "value": "string"}

  // Check for required body fields
  if (!req.body.fields) {
    return res.status(400).json({ error: "missing_fields", messages: "A phonebook entry cannot be created without entries." });
  }

  // Check fields is an array
  if (!Array.isArray(req.body.fields)) {
    return res.status(400).json({ error: "invalid_fields", messages: "The fields parameter must be an array of objects." });
  }

  // Check all fields match the required schema of {"field_id": string, "value": string}
  for (const field of req.body.fields) {
    if (!field.field_id || !field.value) {
      return res.status(400).json({ error: "invalid_field", field: field });
    }
  }

  const entry = await create_phonebook_entry(req.params.phonebook_id, req.user.id, req.body.fields);

  if (entry.error) {
    return res.status(400).json({ error: entry.error, message: entry.message || undefined });
  }

  return res.status(200).json({
    id: entry.id,
    fields: entry.fields,
    created_at: entry.created_at,
  });
});

router.put("/:entry_id", async (req, res) => {
  // Update a phonebook entry
  // Expects an array of new fields and/or an array of updated fields
  // Fields are expected to be {"field_id": "valid field ID from phonebookfields", "value": "string"}

  // Check for required body fields
  if (!req.body.fields) {
    return res.status(400).json({ error: "missing_fields", messages: "A phonebook entry cannot be updated without entries." });
  }

  // Check fields is an array
  if (!Array.isArray(req.body.fields)) {
    return res.status(400).json({ error: "invalid_fields", messages: "The fields parameter must be an array of objects." });
  }

  // Check all fields match the required schema of {"field_id": string, "value": string}
  for (const field of req.body.fields) {
    if (!field.field_id || !field.value) {
      return res.status(400).json({ error: "invalid_field", field: field });
    }
  }

  const entry = await get_phonebook_entry(req.params.entry_id);
  if (!entry) {
    return res.status(400).json({ error: "entry_does_not_exist" });
  }

  // Check if field already exists in the entry
  for (const field of req.body.fields) {
    if (entry.fields.some(f => f.field.id === field.field_id)) {
      // Update the field
      const updated_field = await update_phonebook_entry_field(req.params.entry_id, field.field_id, field.value);
      if (updated_field.error) {
        return res.status(400).json({ error: updated_field.error });
      }
      continue;
    }

    // Add the field
    const added_field = await add_phonebook_entry_field(req.params.entry_id, field.field_id, field.value);
    if (added_field.error) {
      return res.status(400).json({ error: added_field.error });
    }
  }

  return res.status(200).json({
    "success": true
  });
});

router.delete("/:entry_id", async (req, res) => {
  // Delete a phonebook entry
  const entry = await delete_phonebook_entry(req.params.entry_id);

  if (entry.error) {
    return res.status(400).json({ error: entry.error });
  }

  return res.status(200).json({ success: true });
});