// voip-phonebook - Site Management Endpoints
// Endpoints used to create, manage, and delete sites.
// (c) Cameron Fleming 2023.

import { Router } from "express";

import { 
  get_site,
  get_sites,
  get_user_authorised_sites,
  create_site,
  rename_site,
  delete_site,
  add_user_to_site,
  remove_user_from_site,
} from "../site/SiteManage.js";

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

// Import phonebook router, as phonebooks are downstream of sites.
import { router as phonebook_management_router } from './Phonebook'

export const router = Router({ mergeParams: true });

router.get("/", get_and_validate_session, async (req, res) => {
  // List all sites for this user, or all sites if the user is root.
  let sites;
  if (req.user.root_user) {
    sites = await get_sites();
  } else {
    sites = await get_user_authorised_sites(req.user.id);
  }

  if (!sites) {
    return [];
  }

  let public_sites = [];
  for (const site of sites) {
    public_sites.push({
      id: site.id,
      name: site.name,
      authorised_users: site.authorised_users.map(u => u.id),
      created_by: site.created_by.id,
      created_at: site.created_at
    })
  }

  return res.status(200).json(public_sites);
})

router.get("/:site_id", get_and_validate_session, is_authorised_on_site, async (req, res) => {
  // Get a specific site.
  const site = await get_site(req.params.site_id);
  if (!site) {
    return res.status(404).json({ error: "site_does_not_exist" });
  }

  return res.status(200).json({
    id: site.id,
    name: site.name,
    authorised_users: site.authorised_users.map(u => u.id),
    created_by: site.created_by.id,
    created_at: site.created_at
  });
})

router.post("/", get_and_validate_session, is_root, async (req, res) => {
  // Create a new site.
  // Check for required body elements
  // TODO: Sites can only be created by root - permissions overhaul will fix this.
  if (!req.body.name) {
    return res.status(400).json({ error: "missing_name" })
  } else if (!req.body.authorised_users) {
    return res.status(400).json({ error: "missing_authorised_users" })
  }

  // Create the site
  const site = await create_site(req.body.name, req.body.authorised_users, req.user.id);
  if (site.error) {
    return res.status(500).json({ error: site.error });
  }

  return res.status(200).json({
    id: site.id,
    name: site.name,
    authorised_users: site.authorised_users.map(u => u.id),
    created_by: site.created_by.id,
    created_at: site.created_at
  });
})

router.patch("/:site_id", get_and_validate_session, is_root, async (req, res) => {
  // Rename a site.
  // Check for required body elements
  // TODO: Again only root users can rename sites, this could theoretically be done by a site admin.
  if (!req.body.name) {
    return res.status(400).json({ error: "missing_name" })
  }

  // Rename the site
  const site = await rename_site(req.params.site_id, req.body.name);
  if (site.error) {
    return res.status(500).json({ error: site.error });
  }

  return res.status(200).json({ success: true });
})

router.delete("/:site_id", get_and_validate_session, is_root, async (req, res) => {
  // Delete a site.
  const site = await get_site(req.params.site_id);
  if (!site) {
    return res.status(404).json({ error: "site_does_not_exist" });
  }

  await delete_site(req.params.site_id);
  return res.status(200).json({ success: true });
})

// Site user authorisation
router.post("/:site_id/authorise/:user_id", get_and_validate_session, is_root, async (req, res) => {
  // Add authorisation for a user
  const user = await get_user(req.params.user_id);
  if (!user) {
    return res.status(404).json({ error: "user_does_not_exist" });
  }

  const site = await get_site(req.params.site_id);
  if (!site) {
    return res.status(404).json({ error: "site_does_not_exist" });
  }

  const result = await add_user_to_site(req.params.site_id, req.params.user_id);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json({ success: true, message: "Successfully authorised user." });
})

router.delete("/:site_id/authorise/:user_id", get_and_validate_session, is_root, async (req, res) => {
  // Remove authorisation for a user
  const user = await get_user(req.params.user_id);
  if (!user) {
    return res.status(404).json({ error: "user_does_not_exist" });
  }

  const site = await get_site(req.params.site_id);
  if (!site) {
    return res.status(404).json({ error: "site_does_not_exist" });
  }

  const result = await remove_user_from_site(req.params.site_id, req.params.user_id);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json({ success: true, message: "Successfully removed user authorisation." });
})

// Register phonebook management endpoints
router.use("/:site_id/phonebook", get_and_validate_session, is_authorised_on_site, phonebook_management_router);