// voip-phonebook - Phonebook Management Methods
// (c) Cameron Fleming 2023.

import { PhonebookContainer } from "../types/Phonebook";

import { logger } from "../index";
import { get_user } from "../auth/Users";
import { get_site } from "../site/SiteManage";

export const get_phonebook = async (id) => {
  // Get a specific phonebook

  const phonebook = await PhonebookContainer.findOne({ id: id }).populate("site");
  if (!phonebook) return undefined;

  return phonebook;
}

export const get_phonebooks = async () => {
  // Get all phonebooks

  const phonebooks = await PhonebookContainer.find().populate("site");
  return phonebooks;
}

export const get_phonebooks_by_site = async (site_id) => {
  // Get all phonebooks for a site

  const site = await get_site(site_id);
  if (!site) return undefined;

  const phonebooks = await get_phonebooks();
  return phonebooks.filter(phonebook => phonebook.site.id === site.id);
}

export const create_phonebook = async (site_id, name) => {
  // Create a new phonebook
  // site_id must be resolved.

  // Verify site exists
  const site = await get_site(site_id);
  if (!site) {
    logger.warn(`create_phonebook: check site: site ${site_id} does not exist!`);
    return { error: "site_does_not_exist", site: site_id };
  }

  const phonebook = new PhonebookContainer({
    site: site,
    name: name,
  });

  logger.info(`create_phonebook: created phonebook ${phonebook.id} (${phonebook.name}) for site ${site.id} (${site.name})`)

  await phonebook.save();
  return phonebook;
}

export const rename_phonebook = async (id, new_name) => {
  // Rename a phonebook

  const phonebook = await get_phonebook(id);
  if (!phonebook) {
    logger.warn(`rename_phonebook: phonebook ${id} does not exist!`);
    return { error: "phonebook_does_not_exist", phonebook: id };
  }

  logger.info(`rename_phonebook: renamed phonebook ${phonebook.id} (${phonebook.name}) to ${new_name}`);

  phonebook.name = new_name;
  await phonebook.save();
  return phonebook;
}

export const change_phonebook_site = async (id, new_site_id) => {
  // Change the site of a phonebook

  const phonebook = await get_phonebook(id);
  if (!phonebook) {
    logger.warn(`change_phonebook_site: phonebook ${id} does not exist!`);
    return { error: "phonebook_does_not_exist", phonebook: id };
  }

  // Verify new site exists
  const site = await get_site(new_site_id);
  if (!site) {
    logger.warn(`change_phonebook_site: check site: site ${new_site_id} does not exist!`);
    return { error: "site_does_not_exist", site: new_site_id };
  }

  logger.info(`change_phonebook_site: changed phonebook ${phonebook.id} (${phonebook.name}) to site ${site.id} (${site.name})`);

  phonebook.site = site;
  await phonebook.save();
  return phonebook;
}

export const delete_phonebook = async (id) => {
  // Delete a phonebook

  const phonebook = await get_phonebook(id);
  if (!phonebook) {
    logger.warn(`delete_phonebook: phonebook ${id} does not exist!`);
    return { error: "phonebook_does_not_exist", phonebook: id };
  }

  logger.info(`delete_phonebook: deleted phonebook ${phonebook.id} (${phonebook.name})`);

  await PhonebookContainer.deleteOne({ id: id });
  return {success: true};
}