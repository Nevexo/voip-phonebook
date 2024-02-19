// voip-phonebook - User management/authentication endpoints.
// Endpoints used to create, manage, and delete users.
// (c) Cameron Fleming 2023.

import { Router } from "express";
import { 
  create_user, 
  get_user_safe, 
  delete_user, 
  change_user_password, 
  change_user_name, 
  change_user_remark,
  change_user_root_status,
  get_all_users
} from "../auth/Users.js";
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
    return res.status(400).json({ error: "missing_password" })
  }

  // Require password to have a minimum length of 8 characters.
  if (req.body.password.length < 8) {
    return res.status(400).json({ error: "password_complexity_policy_not_met" })
  }

  // Change the user's password.
  const result = await change_user_password(req.params.id, req.body.password)
  if (result.error) return res.status(400).json({error: result.error})

  return res.status(200).json({ success: true })
})

router.delete("/:id", get_and_validate_session, is_root, async (req, res) => {
  // Delete a user by ID
  const user = await get_user_safe(req.params.id)
  if (!user) {
    return res.status(404).json({ error: "user_does_not_exist" })
  }

  // Invalidate all sessions
  await prune_user_sessions(req.params.id)

  const result = await delete_user(req.params.id);
  if (result.error) return res.status(400).json({error: result.error})

  return res.status(200).json({ success: true })
})

