// voip-phonebook - User management/authentication endpoints.
// Endpoints used to create, manage, and delete users.
// (c) Cameron Fleming 2023.

import { Router } from "express";
import { 
  create_user, 
  get_user_safe, 
  get_user,
  delete_user, 
  change_user_password, 
  change_user_name, 
  change_user_remark,
  change_user_root_status,
  get_all_users,
  verify_user_password
} from "../auth/Users.js";
import { Site } from "../types/Site.js";
import { get_user_authorised_sites, remove_user_from_site } from "../site/SiteManage.js";
import {
  prune_user_sessions
} from "../auth/Sessions.js";
import { get_and_validate_session, is_root } from "../middleware/Authentication.js";
import { logger } from "../index";

export const router = Router({ mergeParams: true });

router.post("/", get_and_validate_session, is_root, async (req, res) => {
  // Create a new user
  // Check for required body elements
  if (!req.body.name) {
    return res.status(400).json({ error: "missing_name" })
  } else if (!req.body.email_address) {
    return res.status(400).json({ error: "missing_email_address" })
  } else if (!req.body.password) {
    return res.status(400).json({ error: "missing_password" })
  }

  // Require password to have a minimum length of 8 characters.
  if (req.body.password.length < 8) {
    return res.status(400).json({ error: "password_complexity_policy_not_met" })
  }

  // Regex email address
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email_regex.test(req.body.email_address)) {
    return res.status(400).json({ error: "invalid_email_address" })
  }  

  // Create the user.
  const user = await create_user(
    req.body.name,
    req.body.email_address,
    req.body.password,
    false, // Root user cannot be created this way, must be upgraded later.
    req.body.remark || "N/A"
  )

  if (user.error) {
    return res.status(400).json({ error: user.error })
  }

  // Return the user.
  return res.status(200).json(await get_user_safe(user.id))
})

router.get("/", get_and_validate_session, is_root, async (req, res) => {
  // Get all users
  return res.status(200).json(await get_all_users())
})

router.get("/:id", get_and_validate_session, async (req, res) => {
  // Get a user by ID
  if (!req.user.root_user && req.user.id != req.params.id) {
    return res.status(403).json({ 
      error: "user_is_not_root_or_self", 
      message: "You are not a root user, and the user ID you're fetching is not yourself."
    })
  }

  const user = await get_user_safe(req.params.id)
  if (!user) {
    return res.status(404).json({ error: "user_does_not_exist" })
  }

  return res.status(200).json(user)
})

router.post("/:id/root", get_and_validate_session, is_root, async (req, res) => {
  // Upgrade a user to root
  const user = await get_user_safe(req.params.id)
  if (!user) {
    return res.status(404).json({ error: "user_does_not_exist" })
  }

  // Upgrade the user to root.
  await change_user_root_status(req.params.id, true)

  return res.status(200).json({ success: true })
})

router.delete("/:id/root", get_and_validate_session, is_root, async (req, res) => {
  // Downgrade a user from root
  const user = await get_user_safe(req.params.id)
  if (!user) {
    return res.status(404).json({ error: "user_does_not_exist" })
  }

  // Downgrade the user from root.
  await change_user_root_status(req.params.id, false)

  return res.status(200).json({ success: true })
});

router.patch("/:id/password", get_and_validate_session, async (req, res) => {
  if (!req.user.root_user && req.user.id != req.params.id) {
    return res.status(403).json({ 
      error: "user_is_not_root_or_self", 
      message: "You are not a root user, and the user ID you're trying to change the password of is not yourself."
    })
  }

  // Change a user's password
  if (!req.body.password) {
    logger.warn(`user_management: change_user_password: user ${req.params.id} did not provide new password`)
    return res.status(400).json({ error: "missing_password" })
  }

  // Require password to have a minimum length of 8 characters.
  if (req.body.password.length < 8) {
    logger.warn(`user_management: change_user_password: user ${req.params.id} did not meet password complexity policy`)
    return res.status(400).json({ error: "password_complexity_policy_not_met" })
  }

  // If the user is changing their own password, require the old password, and validate it.
  if (req.user.id == req.params.id) {
    if (!req.body.old_password) {
      logger.warn(`user_management: change_user_password: user ${req.params.id} did not provide old password`)
      return res.status(400).json({ error: "missing_old_password" })
    }

    // Validate old password
    const user = await get_user(req.params.id)
    if (!await verify_user_password(user.id, req.body.old_password)) {
      logger.warn(`user_management: change_user_password: user ${req.params.id} provided incorrect old password`)
      return res.status(401).json({ error: "incorrect_old_password" })
    }
  }

  // Change the user's password.
  const result = await change_user_password(req.params.id, req.body.password)
  if (result.error) return res.status(400).json({error: result.error})

  // Invalidate all sessions
  await prune_user_sessions(req.params.id)

  return res.status(200).json({ success: true })
})

router.delete("/:id", get_and_validate_session, is_root, async (req, res) => {
  // Delete a user by ID
  const user = await get_user(req.params.id)
  if (!user) {
    return res.status(404).json({ error: "user_does_not_exist" })
  }

  // Check user isn't authorised on any sites, get all sites and use is_authorised_on_site
  // const sites_full = await Site.find()
  const authorised_sites = await get_user_authorised_sites(user.id)
  // De-authorise the user TODO: Document this
  if (process.env.AUTO_DEAUTHORISE_USER_ON_DELETE == "true") {
    logger.debug("user_mgmt: delete_user: AUTO_DEAUTHORISE_USER_ON_DELETE is true, deauthorising user from all sites")
    for await (let site of authorised_sites) {
      logger.debug("user_mgmt: delete_user: deauthorising user from site " + site.id + " (" + site.name + ")")
      await remove_user_from_site(site.id, user.id)
    }
  } else {
    if (authorised_sites.length > 0) {
      return res.status(400).json({ error: "user_authorised_on_sites" })
    }
  }
  

  // Invalidate all sessions
  await prune_user_sessions(req.params.id)

  const result = await delete_user(req.params.id);
  if (result.error) return res.status(400).json({error: result.error})

  return res.status(200).json({ success: true })
})

