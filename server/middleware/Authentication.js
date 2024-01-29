// voip-phonebook - Session Handling Middleware
// This middleware provides authentication for the API, and is used to verify that a user is logged in.
// It will be required by certain routers/endpoints.
// (c) Cameron Fleming 2023.

import { UserSession } from "../types/UserSession";
import { validate_session, get_session_safe } from "../auth/Sessions";
import { get_user_safe } from "../auth/Users";

export const get_and_validate_session = async (req, res, next) => {
  // Validate a session.
  if (!req.headers['authorization']) {
    return res.status(400).json({ error: "missing_authorization_header" })
  }

  if (!req.headers['authorization'].startsWith("Bearer ")) {
    return res.status(401).json({ error: "invalid_token_format", message: "Expected bearer token." })
  }

  const auth_token = req.headers['authorization'].replace("Bearer ", "")
  const session = await validate_session(auth_token)
  if (session.error) {
    return res.status(401).json({ error: session.error })
  }

  // Add the user and session to the request.
  req.user = session.user
  req.session = session.session

  // Continue.
  next()
}

export const is_root = async (req, res, next) => {
  // Check if the user is a root user.
  if (!req.user.root_user) {
    return res.status(403).json({ error: "user_is_not_root" })
  }

  // Continue.
  next()
}