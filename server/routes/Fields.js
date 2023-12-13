// voip-phonebook - Phonebook Field Management Endpoints
// These endpoints are used to create, update, and delete phonebook fields.
// Works downstream of sites, authentication is handled by the upstream.
// (c) Cameron Fleming 2023.

// This router is loaded by the site router, so expect the url to be /site/:id/field/...

import { Router } from "express";

import {
  get_phonebook_field,
  get_phonebook_fields_for_site,
  create_phonebook_field,
  delete_phonebook_field,
} from "../fields/PhonebookFieldManager.js";

export const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  // List all phonebook fields for this site.
  const fields = await get_phonebook_fields_for_site(req.params.site_id);

  if (!fields) {
    return res.status(200).json([]);
  }

  let public_fields = [];
  for (const field of fields) {
    public_fields.push({
      id: field.id,
      name: field.name,
      type: field.type,
      required: field.required,
      created_at: field.created_at
    })
  }

  return res.status(200).json(public_fields);
});

router.get("/:field_id", async (req, res) => {
  // Get a specific phonebook field
  const field = await get_phonebook_field(req.params.field_id);

  if (!field) {
    return res.status(404).json({ error: "field_does_not_exist" });
  }

  return res.status(200).json({
    id: field.id,
    name: field.name,
    type: field.type,
    required: field.required,
    created_at: field.created_at
  });
});

router.post("/", async (req, res) => {
  // Create a new phonebook field
  // Check for required body elements (name, type, required)
  if (!req.body.name || !req.body.type || req.body.required === undefined) {
    return res.status(400).json({ error: "missing_required_body_elements" });
  }

  const field = await create_phonebook_field(req.params.site_id, req.body.name, req.body.type, req.body.required);
  if (!field) {
    return res.status(500).json({ error: "unknown_error" });
  }

  if (field.error) {
    switch (field.error) {
      case "site_does_not_exist":
        return res.status(400).json({ error: "site_does_not_exist" });
      case "type_is_not_valid":
        return res.status(400).json({ error: "type_is_not_valid" });
      case "field_already_exists":
        return res.status(400).json({ error: "field_already_exists" });
      default:
        return res.status(500).json({ error: field.error });
    }
  }

  return res.status(200).json({
    id: field.id,
    name: field.name,
    type: field.type,
    required: field.required,
    created_at: field.created_at
  });
});

router.delete("/:field_id", async (req, res) => {
  // Delete a phonebook field
  const field = await delete_phonebook_field(req.params.field_id);

  if (field.error) {
    switch (field.error) {
      case "field_does_not_exist":
        return res.status(404).json({ error: "field_does_not_exist" });
      default:
        return res.status(500).json({ error: field.error });
    }
  }

  return res.status(200).json({ success: true });
});