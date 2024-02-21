import { api } from './index';
import { auth } from '../main';
import { API_URL } from './index';

export const valid_types = ["text", "number", "email", "bool"];

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

export const remove_authorised_user = async (site_id, user_id) => {
  // Remove a user from a site, requires root user.
  try {
    const response = await api.delete(`${API_URL}/site/${site_id}/authorise/${user_id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const add_authorised_user = async (site_id, user_id) => {
  // Add a user to a site, requires root user.
  try {
    const response = await api.post(`${API_URL}/site/${site_id}/authorise/${user_id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const delete_site = async (site_id) => {
  // Delete a site, requires root user.
  try {
    const response = await api.delete(`${API_URL}/site/${site_id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const get_phonebooks = async (site_id) => {
  // Get all phonebooks for a site, requires authentication.
  try {
    const response = await api.get(`${API_URL}/site/${site_id}/phonebook`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export const get_fields = async (site_id) => {
  // Get all fields for a site, requires authentication.
  try {
    const response = await api.get(`${API_URL}/site/${site_id}/field`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const create_field = async (site_id, name, type, required) => {
  if (!valid_types.includes(type)) return {error: 'invalid_type'}
  if (name.length < 1) return {error: 'no_name_provided'}

  try {
    const response = await api.post(`${API_URL}/site/${site_id}/field`, {
      name: name,
      type: type,
      required: required
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const delete_field = async (site_id, field_id) => {
  try {
    const response = await api.delete(`${API_URL}/site/${site_id}/field/${field_id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}