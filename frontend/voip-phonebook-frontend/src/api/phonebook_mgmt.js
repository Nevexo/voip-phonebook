import { api } from './index';
import { auth } from '../main';
import { API_URL } from './index';

export const create_phonebook = async (site_id, name) => {
  // Create a new phonebook, requires root user.
  if (name.length == 0) return {error: 'no_name_provided'}
  try {
    const response = await api.post(`${API_URL}/site/${site_id}/phonebook`, {
      name: name
    });
    return response.data;

  } catch (error) {
    return error.response.data;
  }
}

export const get_phonebook = async (site_id, phonebook_id) => {
  // Get phonebook by id, requires authentication.
  try {
    const response = await api.get(`${API_URL}/site/${site_id}/phonebook/${phonebook_id}`);
    return response.data;
  } catch (error) {
    return response.data;
  }
}

export const delete_phonebook = async (site_id, phonebook_id) => {
  // Delete a phonebook.
  try {
    const response = await api.delete(`${API_URL}/site/${site_id}/phonebook/${phonebook_id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const get_entries = async (site_id, phonebook_id) => {
  // Get all entries for a phonebook, requires authentication.
  try {
    const response = await api.get(`${API_URL}/site/${site_id}/phonebook/${phonebook_id}/entry`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
export const create_entry = async (site_id, phonebook_id, fields) => {
  // Create a new field in the phonebook, requires authentication.
  try {
    const response = await api.post(`${API_URL}/site/${site_id}/phonebook/${phonebook_id}/entry`, {
      "fields": fields
    });
    return response.data;
  } catch(error) {
    console.dir(error)
    return error.response.data;
  }
}
}