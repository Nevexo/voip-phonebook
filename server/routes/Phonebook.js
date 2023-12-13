// voip-phonebook - Phonebook Management Endpoints
// Endpoints used to create, update and delete phonebooks.
// (c) Cameron Fleming 2023.

// This router is downstream of a site, so expect the url to be /site/:id/phonebook/...
// This is because phonebooks must always be associated with a site, but can migrate between sites.

// This router is loaded 

import { Router } from "express";

import {
  get_phonebook,
  get_phonebooks,
  get_phonebooks_by_site,
  create_phonebook,
  rename_phonebook,
  delete_phonebook,
} from "../phonebook/BookManage.js";

import {
  get_user
} from "../auth/Users.js";

import {
  get_and_validate_session,
  is_root
} from "../middleware/Authentication.js";

import {
  is_authorised_on_site
} from "../middleware/SiteAuthorisation.js";

import {
  get_site
} from "../site/SiteManage.js";

export const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  // List all phonebooks for this site.
  const phonebooks = await get_phonebooks_by_site(req.params.site_id);

  if (!phonebooks) {
    return res.status(200).json([]);
  }

  let public_phonebooks = [];
  for (const phonebook of phonebooks) {
    public_phonebooks.push({
      id: phonebook.id,
      name: phonebook.name,
      created_at: phonebook.created_at
    })
  }

  return res.status(200).json(public_phonebooks);
});

router.get("/:phonebook_id", async (req, res) => {
  // Get a specific phonebook
  const phonebook = await get_phonebook(req.params.phonebook_id);

  if (!phonebook) {
    return res.status(404).json({ error: "phonebook_does_not_exist" });
  }

  return res.status(200).json({
    id: phonebook.id,
    name: phonebook.name,
    created_at: phonebook.created_at
  });
});

router.post("/", async (req, res) => {
  // Create a new phonebook
  // Check for required body elements (name)
  if (!req.body.name) {
    return res.status(400).json({ error: "missing_name" });
  }

  if (req.body.name.length < 0 || req.body.name.length > 64) {
    return res.status(400).json({ error: "invalid_name_length", message: "Name must be between 1 and 64 characters." });
  }

  // Check if phonebook already exists with this name, on this site.
  const phonebooks = await get_phonebooks_by_site(req.params.site_id);
  if (phonebooks.some(p => p.name === req.body.name)) {
    return res.status(400).json({ error: "phonebook_already_exists" });
  }

  const phonebook = await create_phonebook(req.params.site_id, req.body.name, req.user.id);
  if (phonebook.error) {
    return res.status(400).json(phonebook);
  }

  return res.status(200).json({
    id: phonebook.id,
    name: phonebook.name,
    created_at: phonebook.created_at
  });
});

router.put("/:phonebook_id", async (req, res) => {
  // Rename a phonebook
  // Check for required body elements (name)
  if (!req.body.name) {
    return res.status(400).json({ error: "missing_name" });
  }

  if (req.body.name.length < 0 || req.body.name.length > 64) {
    return res.status(400).json({ error: "invalid_name_length", message: "Name must be between 1 and 64 characters." });
  }

  // Check if phonebook already exists with this name, on this site.
  const phonebooks = await get_phonebooks_by_site(req.params.site_id);
  if (phonebooks.some(p => p.name === req.body.name)) {
    return res.status(400).json({ error: "phonebook_already_exists" });
  }

  const phonebook = await rename_phonebook(req.params.phonebook_id, req.body.name);
  if (phonebook.error) {
    return res.status(400).json({error: phonebook.error});
  }

  return res.status(200).json({
    id: phonebook.id,
    name: phonebook.name,
    created_at: phonebook.created_at
  });
});

router.delete("/:phonebook_id", async (req, res) => {
  // Delete a phonebook
  const phonebook = await delete_phonebook(req.params.phonebook_id);
  if (phonebook.error != undefined) {
    switch (phonebook.error) {
      case "phonebook_does_not_exist":
        return res.status(404).json({ error: "phonebook_does_not_exist" });
      default:
        return res.status(500).json({ error: "unknown_error" });
    }
  }

  return res.status(200).json({ success: true });
});