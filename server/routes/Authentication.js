// voip-phonebook - Authentication Endopints
// (c) Cameron Fleming 2023.

import { Router } from "express";

import {
  get_user_by_email,
  verify_user_password
} from "../auth/Users.js";

import {
  create_user_session,
  delete_session,
  get_all_user_sessions_safe,
  prune_user_sessions
} from "../auth/Sessions.js";

import { logger } from "../index";
import { get_and_validate_session } from "../middleware/Authentication.js";

export const router = Router({ mergeParams: true });

router.post("/session", async (req, res) => {
  // Login a user.
  // Check if the user exists.
  // Check for required body elements
  if (!req.body.email_address) {
    return res.status(400).json({ error: "missing_email_address" })
  } else if (!req.body.password) {
    return res.status(400).json({ error: "missing_password" })
  }

  const user = await get_user_by_email(req.body.email_address)
  if (!user) {
    return res.status(401).json({ error: "user_does_not_exist" })
  }

  // Check if the password is correct.
  if (!await verify_user_password(user.id, req.body.password)) {
    return res.status(401).json({ error: "user_does_not_exist" })
  }

  // Create a new session.
  const session = await create_user_session(user.id, req.headers['user-agent'])

  // Return the session.
  return res.status(200).json(session)
})

router.get("/session", get_and_validate_session, async (req, res) => {
  // Validate a session using the session middleware.

  // // Return the session.
  return res.status(200).json({ user: req.user, session: req.session })
})

router.get("/sessions", get_and_validate_session, async (req, res) => {
  // Get all sessions for this user

  return res.status(200).json(get_all_user_sessions_safe(req.user.id));
})

router.delete("/session", get_and_validate_session, async (req, res) => {
  // Delete the session.
  await delete_session(req.session.id)

  return res.status(200).json({ status: "session_deleted" })
})

router.delete("/sessions", get_and_validate_session, async (req, res) => {
  // Delete all sessions for a user.
  await prune_user_sessions(req.user.id)

  return res.status(200).json({ status: "all_sessions_deleted" })
})