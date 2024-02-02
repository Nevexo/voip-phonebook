// voip-phonebook - Entitlement Manager Endpoints
// This module provides REST endpoints for managing the vendor service
// entitlements, creating, updating and deleting them.

// These endpoints are downstream of a site, so expect /site/:id/entitlement...

// (c) Cameron Fleming 2024.

import { Router } from "express";
import { logger } from "../index";

import { 
  get_entitlements, 
  get_entitlement_by_id, 
  create_entitlement, 
  update_entitlement,
  get_entitlements_for_site
} from "../vendors/EntitlementManager";

export const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  // Get all entitlements for this site.
  const entitlements = await get_entitlements_for_site(req.params.site_id);
  if (entitlements.error) {
    return res.status(404).json({ error: entitlements.error });
  }

  return res.status(200).json(entitlements);
});

router.get("/:entitlement_id", async (req, res) => {
  // Get a specific entitlement.
  const entitlement = await get_entitlement_by_id(req.params.entitlement_id);
  if (!entitlement) {
    return res.status(404).json({ error: "entitlement_does_not_exist" });
  }

  if (entitlement.site.id !== req.params.id) {
    return res.status(403).json({ error: "entitlement_does_not_exist" });
  }

  return res.status(200).json(entitlement);
});

router.post("/", async (req, res) => {
  // Create a new entitlement.
  const required_fields = ["vendor_service_id", "field_mapping"]

  for (const field of required_fields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `missing_${field}` });
    }
  }

  const entitlement = await create_entitlement(req.params.site_id, req.body.vendor_service_id, req.body.configuration || {}, req.body.field_mapping);
  if (entitlement.error) {
    return res.status(400).json({ error: entitlement.error, message: entitlement.message });
  }

  return res.status(201).json(entitlement);
});