// voip-phonebook - Site Authorisation Middleware
// This middleaare checks permissions for site management. It will also check for root.
// This middleware does not check for valid sessions, use middleware/Authentication for that.
// (c) Cameron Fleming 2023.

import { user_is_authorised_on_site } from "../site/SiteManage";
import { user_is_root } from "../auth/Users";
import { logger } from "..";

export const is_authorised_on_site = async (req, res, next) => {
  // Check for root
  if (await user_is_root(req.user.id)) {
    logger.debug("middleware: site_authorisation: is_authorised_on_site: user is root, continuing")
    return next()
  }

  // Check if the user is authorised on the site.
  if (!await user_is_authorised_on_site(req.params.site_id, req.user.id)) {
    logger.debug("middleware: site_authorisation: is_authorised_on_site: user is not authorised on site")
    return res.status(403).json({ error: "user_is_not_authorised_on_site" })
  }

  // Continue.
  logger.debug(`middleware: site_authorisation: is_authorised_on_site: user ${req.user.name} is authorised on site, continuing`)
  next()
}