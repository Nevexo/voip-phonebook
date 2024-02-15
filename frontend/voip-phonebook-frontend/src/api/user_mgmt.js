import { api } from './index';
import { auth } from '../main';
import { API_URL } from './index';

export const get_users = async () => {
  // Get all users, requires root.
  if (!auth.user.root_user) return null;
  try {
    const response = await api.get(`${API_URL}/user`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export const get_user = async (id) => {
  // Get a user by ID, requires root.
  if (!auth.user.root_user) return null;
  try {
    const response = await api.get(`${API_URL}/user/${id}`);
    return response.data;
  } catch (error) {
    return false;
  }
}

export const update_root_status = async (id, state) => {
  // Update the root status of a user, requires root.
  if (!auth.user.root_user) return null;
  if (state) {
    try {
      const response = await api.post(`${API_URL}/user/${id}/root`, {
        root: state
      });
      return response.data;
    } catch (error) {
      return false;
    }
  } else {
    try {
      const response = await api.delete(`${API_URL}/user/${id}/root`, {
        root: state
      });
      return response.data;
    } catch (error) {
      return false;
    }
  }
}

export const delete_user = async (id) => {
  // Delete a user, requires root.
  if (!auth.user.root_user) return null;
  try {
    const response = await api.delete(`${API_URL}/user/${id}`);
    return response.data;
  } catch (error) {
    return false;
  }
}