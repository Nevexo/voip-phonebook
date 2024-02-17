import { api } from './index';
import { auth } from '../main';
import { API_URL } from './index';

export const get_sites = async () => {
  // Get all sites, requires authentication.
  try {
    const response = await api.get(`${API_URL}/site`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export const get_site = async (id) => {
  // Get site by id, requires authentication.
  try {
    const response = await api.get(`${API_URL}/site/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export const create_site = async (name, authorised_users) => {
  // Create a new site, requires root user.
  if (authorised_users.length == 0) return {error: 'no_authorised_users'}
  if (name.langth == 0) return {error: 'no_name_provided'}
  try {
    const response = await api.post(`${API_URL}/site`, {
      name: name,
      authorised_users: authorised_users
    });
    return response.data;

  } catch (error) {
    return error.response.data;
  }
}