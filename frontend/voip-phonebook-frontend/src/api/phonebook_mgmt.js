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