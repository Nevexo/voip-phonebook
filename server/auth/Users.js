// voip-phonebook - User Management Methods
// (c) Cameron Fleming 2023.

// NOTE: This makes use of the Bun library, making it incompatible with Node.

import { User } from "../types/User";
import { Site } from "../types/Site";
import { logger } from "../index";

export const get_user = async (id) => {
  // Get a user from the database.
  return await User.findOne({ id: id });
}

export const get_user_safe = async (id) => {
  // Get a user from the database, but don't return the password hash.
  return await User.findOne({ id: id }, { password_hash: 0, _id: 0, __v: 0 });
}

export const get_user_by_email = async (email_address) => {
  const user = await User.findOne({ email_address: email_address });

  if (!user) return undefined;
  return get_user_safe(user.id);
}

export const user_is_root = async (id) => {
  // Check if a user is a root user.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`user_is_root: user ${id} does not exist!`)
    return false
  }
  return user.root_user
}

export const create_user = async (
  name, email_address, plain_text_password, root_user = false, remark = "") => {
    // Create a new user in the database.
    // Verify email_address is unique.
    if (await User.findOne({ email_address: email_address })) {
      logger.warn(`create_user: email_address ${email_address} already exists!`)
      return { error: "email_address_already_exists" }
    }
    
    // Hash the password.
    const password_hash = await Bun.password.hash(plain_text_password, {
      algorithm: "bcrypt",
      cost: 10,
    })

    // Create the user.
    const user = new User({
      name: name,
      email_address: email_address,
      password_hash: password_hash,
      root_user: root_user,
      remark: remark
    })

    // Save the user.
    await user.save()

    logger.info(`user_management: create_user: new user created - ${user.id} (${user.email_address})`)

    // Return the user.
    return user
  }

export const delete_user = async (id) => {
  // Delete a user from the database.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`delete_user: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Ensure user doesn't own any sites
  const sites = await Site.find({ created_by: user })
  if (sites.length > 0) {
    logger.warn(`delete_user: user ${id} owns sites!`)
    return { error: "user_owns_sites" }
  }

  // Delete mongoose entry
  await User.deleteOne({ id: id });

  logger.info(`user_management: delete_user: user ${id} deleted`)
  return user
}

export const verify_user_password = async (id, plain_text_password) => {
  // Verify a user's password.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`verify_user_password: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Verify password
  if (!await Bun.password.verify(plain_text_password, user.password_hash, "bcrypt")) {
    logger.warn(`verify_user_password: user ${id} provided incorrect password`)
    return false
  }

  logger.debug(`user_management: verify_user_password: user ${id} provided correct password`)
  return true
}

export const change_user_password = async (id, plain_text_password) => {
  // Change a user's password.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`change_user_password: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Hash the password.
  const password_hash = await Bun.password.hash(plain_text_password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // Update the user.
  await User.updateOne({ id: id }, { password_hash: password_hash })

  // Validate the password with verify_user_password.
  if (!await verify_user_password(id, plain_text_password)) {
    logger.error(`user_management: change_user_password: user ${id} password update failed validation.`)
    return { error: "password_update_failed" }
  }

  logger.info(`user_management: change_user_password: user ${id} changed password`)
  return true
}

export const change_user_name = async (id, name) => {
  // Change a user's name.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`change_user_name: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Update the user.
  await User.updateOne({ id: id }, { name: name })

  logger.info(`user_management: change_user_name: user ${id} changed name`)
  return true
}

export const change_user_email_address = async (id, email_address) => {
  // Change a user's email address.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`change_user_email_address: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Verify email_address is unique.
  if (await User.findOne({ email_address: email_address })) {
    logger.warn(`change_user_email_address: email_address ${email_address} already exists!`)
    return { error: "email_address_already_exists" }
  }

  // Update the user.
  await User.updateOne({ id: id }, { email_address: email_address })

  logger.info(`user_management: change_user_email_address: user ${id} changed email_address`)
  return true
}

export const change_user_remark = async (id, remark) => {
  // Change a user's remark.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`change_user_remark: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Update the user.
  await User.updateOne({ id: id }, { remark: remark })

  logger.info(`user_management: change_user_remark: user ${id} changed remark`)
  return true
}

export const change_user_root_status = async (id, root_user) => {
  // Change a user's root status.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`change_user_root_status: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Update the user.
  await User.updateOne({ id: id }, { root_user: root_user })

  logger.info(`user_management: change_user_root_status: user ${id} changed root status`)
  return true
}

export const update_user_last_login = async (id) => {
  // Update a user's last login time.
  const user = await get_user(id)
  if (!user) {
    logger.warn(`update_user_last_login: user ${id} does not exist!`)
    return { error: "user_does_not_exist" }
  }

  // Update the user.
  await User.updateOne({ id: id }, { last_login: Date.now() })

  logger.info(`user_management: update_user_last_login: user ${id} updated last login`)
  return true
}


export const get_all_users = async () => {
  // List all users.
  return await User.find({}, { password_hash: 0, _id: 0, __v: 0 });
}