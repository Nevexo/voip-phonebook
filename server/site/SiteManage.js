// voip-phonebook - Site Management Methods
// (c) Cameron Fleming 2023.

import { Site } from "../types/Site";

import { logger } from "../index";
import { get_user } from "../auth/Users";

import { create_phonebook_field, get_phonebook_fields_for_site, delete_phonebook_field } from "../fields/PhonebookFieldManager";
import { get_phonebooks_by_site } from "../phonebook/BookManage";

export const get_site = async (id) => {
  // Get a specific site

  const site = await Site.findOne({ id: id }).populate("authorised_users").populate("created_by", "id username root_user");
  if (!site) return undefined;

  return site;
}

export const get_sites = async () => {
  // Get all sites

  const sites = await Site.find().populate("authorised_users").populate("created_by", "id username root_user");
  return sites;
}

export const get_user_authorised_sites = async (user_id) => {
  // Get all sites where a user is authorised

  const user = await get_user(user_id);
  if (!user) return undefined;

  const sites = await get_sites();
  return sites.filter(site => site.authorised_users.some(u => u.id === user.id));
}

export const create_site = async (name, authorised_users, created_by) => {
  // Create a new site
  // authorised_users is an array of IDs, must be resolved.

  // Verify all authorised users exist
  let authorised_users_object = [];
  for (const user of authorised_users) {
    const user_object = await get_user(user)
    if (!user_object) {
      logger.warn(`create_site: check authorised_users: user ${user} does not exist!`);
      authorised_users_object.push(user_object);
      return { error: "authorised_user_does_not_exist", user: user };
    }
  }

  const site = new Site({
    name: name,
    authorised_users: authorised_users_object,
    created_by: await get_user(created_by)
  });

  await site.save();
  logger.info(`create_site: created site ${site.id} (${site.name})`)

  // Create default site fields
  // TODO: Make this dynamic.

  logger.debug(`create_site: creating default site fields for site ${site.id} (${site.name})`);
  await create_phonebook_field(site.id, "First Name", "text", true, true);
  await create_phonebook_field(site.id, "Last Name", "text", true, true);

  return site;
}

export const rename_site = async (id, new_name) => {
  // Rename a site

  const site = await get_site(id);
  if (!site) return undefined;

  site.name = new_name;
  await site.save();
  return site;
}

export const delete_site = async (id) => {
  // Delete a site
  const site = await get_site(id);
  if (!site) return undefined;

  // Check for any phonebooks
  const phonebooks = await get_phonebooks_by_site(id);
  if (phonebooks.length > 0) {
    logger.warn(`delete_site: check phonebooks: site ${id} has phonebooks!`);
    return { error: "site_has_phonebooks" };
  }

  // Check for any phonebook fields that are not marked system_created
  const fields = await get_phonebook_fields_for_site(id);
  if (fields.some(f => !f.created_by_system)) {
    logger.warn(`delete_site: check phonebook fields: site ${id} has non-system-created fields!`);
    return { error: "site_has_non_system_created_fields" };
  }

  // Delete all system fields with force delete.
  for (const field of fields) {
    await delete_phonebook_field(field.id, true);
  }

  await Site.deleteOne({ id: id });
  return site;
}

export const add_user_to_site = async (site_id, user_id) => {
  // Add a user to a site

  const site = await get_site(site_id);
  if (!site) return undefined;

  const user = await get_user(user_id);
  if (!user) return undefined;

  // Ensure user isn't already authorised, the site is fully populated.
  if (site.authorised_users.some(u => u.id === user.id)) {
    logger.warn(`add_user_to_site: user ${user_id} is already authorised on site ${site_id}!`);
    return { error: "user_already_authorised" };
  }

  site.authorised_users.push(user);
  await site.save();

  logger.info(`add_user_to_site: user ${user_id} authorised on site ${site_id}`)
  return site;
}

export const remove_user_from_site = async (site_id, user_id) => {
  // Remove a user from a site

  const site = await get_site(site_id);
  if (!site) return undefined;

  const user = await get_user(user_id);
  if (!user) return undefined;

  // Ensure user is authorised
  const userIndex = site.authorised_users.findIndex(u => u.id === user.id);
  if (userIndex === -1) {
    logger.warn(`remove_user_from_site: user ${user_id} is not authorised on site ${site_id}!`);
    return { error: "user_not_authorised" };
  }

  site.authorised_users.splice(site.authorised_users.indexOf(user), 1);
  await site.save();

  logger.info(`remove_user_from_site: user ${user_id} removed from site ${site_id}`)
  return site;
}

export const user_is_authorised_on_site = async (site_id, user_id) => {
  // Check if a user is authorised on a site

  const site = await get_site(site_id);
  if (!site) return undefined;

  const user = await get_user(user_id);
  if (!user) return undefined;

  return site.authorised_users.some(u => u.id === user.id);
}