// voip-phonebook - Vendor Services Management Endpoints
// These endpoints are used to monitor the status of vendor services.
// (c) Cameron Fleming 2024.

import { Router } from "express";

import { get_and_validate_session, is_root } from "../middleware/Authentication.js";

import { 
  get_services,
  get_service_by_id,
  get_service_by_name,
  delete_service
} from "../vendors/VendorManager.js";

import { logger } from "../index";

export const router = Router();

router.get("/", get_and_validate_session, async (req, res) => {
  // List all services. If ?connected=true is provided, then only return
  // services that are not "not_connected" in the status.
  const connected = req.query.connected;
  const services = await get_services();

  if (connected) {
    const connected_services = services.filter(service => service.status !== "not_connected");
    return res.status(200).json(connected_services);
  }

  return res.status(200).json(services);
})

router.get("/by-name/:name", get_and_validate_session, async (req, res) => {
  const service = await get_service_by_name(req.params.name);
  if (!service) {
    return res.status(404).json({ error: "service_does_not_exist" });
  }

  return res.status(200).json(service);
})

router.get("/:id", get_and_validate_session, async (req, res) => {
  const service = await get_service_by_id(req.params.id);
  if (!service) {
    return res.status(404).json({ error: "service_does_not_exist" });
  }

  return res.status(200).json(service);
})

router.delete("/:id", get_and_validate_session, is_root, async (req, res) => {
  // Delete a vendor service using delete_service
  const service = await delete_service(req.params.id);
  if (service.error) {
    return res.status(404).json({ error: service.error });
  }

  return res.statusCode(200).json({"success": true});
})