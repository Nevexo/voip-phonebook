// voip-phonebook - User management/authentication.
// These methods are used to create, manage, and delete user sessions.
// (c) Cameron Fleming 2023.

import { get_user, get_user_safe, update_user_last_login } from "../auth/Users";
import { UserSession } from "../types/UserSession.js";
import { logger } from "../index";
import { nanoid } from 'nanoid';
import { User } from "../types/User.js";

const get_session = async (id) => {
  // Get a session from the database.
  return await UserSession.findOne({ id: id })
}

export const get_session_safe = async (id) => {
  // Get a session from the database, but don't return the token.
  // If object_id use that instead
  return await UserSession.findOne({ id: id }, { token: 0, _id: 0, __v: 0 })
}

export const get_all_user_sessions_safe = async(id) => {
  // Get all sessions for a user, but don't return the token.
  return await UserSession.find({ user: id }, { token: 0, _id: 0, __v: 0 })
}

export const validate_session = async (token) => {
  // Validate a session.
  const session = await UserSession.findOne({ token: token }).populate("user");
  if (!session) {
    return { error: "session_does_not_exist" }
  }

  if (session.expires_at < Date.now()) {
    logger.warn(`user_management: validate_session: session ${session.id} has expired!`)
    // Delete the session
    await delete_session(session.id)
    return { error: "session_has_expired" }
  }

  return {
    user: await get_user_safe(session.user.id),
    session: await get_session_safe(session.id)
  }
}

export const create_user_session = async (user_id, user_agent) => {
  // Create a new user session.
  // Check if the user exists.
  const user = await get_user(user_id)
  if (!user) {
    logger.warn(`user_management: create_user_session: user ${user_id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  logger.debug("create_user_session: creating new session...")
  // Create the session.
  const session = new UserSession({
    user: user,
    user_agent: user_agent
  })

  // Save the session.
  await session.save()

  logger.info(`user_management: create_user_session: new session created -\
   ${session.id} (${user_id}/${user.email_address})`)

  // Update last login time.
  await update_user_last_login(user_id)

  // Return the session.
  return {
    session_token: session.token,
    session: await get_session_safe(session.id)
  }
}

export const delete_session = async (id) => {
  // Delete a session from the database.
  const session = await get_session(id)
  if (!session) {
    logger.warn(`user_management: delete_session: session ${id} does not exist!`)
    return { error: "session_does_not_exist" }
  }

  await UserSession.deleteOne({ id: id })
  logger.info(`user_management: delete_session: session ${id} deleted!`)
  return true
}

export const prune_session = async () => {
  // Delete all expired sessions
  const sessions = await UserSession.find()
  let deleted_sessions = 0
  for (const session of sessions) {
    if (session.expires_at < Date.now()) {
      await delete_session(session.id)
      deleted_sessions++
    }
  }
  logger.info(`user_management: prune_session: deleted ${deleted_sessions} expired sessions!`)
}

export const prune_user_sessions = async (user_id) => {
  // Delete all sessions for a user.
  // User id is within user object.
  const user = await get_user(user_id)
  if (!user) {
    logger.warn(`user_management: prune_user_sessions: user ${user_id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  const sessions = await UserSession.find({ user: user }).populate("user")
  let deleted_sessions = 0
  for (const session of sessions) {
    await delete_session(session.id)
    deleted_sessions++
  }
  logger.info(`user_management: prune_user_sessions: deleted ${deleted_sessions} sessions for user ${user_id}!`)
  
  return true;
}