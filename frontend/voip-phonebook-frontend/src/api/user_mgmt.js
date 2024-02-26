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
    return error.response.data;
  }
}

export const create_user = async (name, email, password, remark) => {
  // Create a user, requires root.
  if (!auth.user.root_user) return null;
  try {
    const response = await api.post(`${API_URL}/user`, {
      name: name,
      email_address: email,
      password: password,
      remark: remark
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const change_password = async (id, password) => {
  // Change a user's password
  try {
    const response = await api.patch(`${API_URL}/user/${id}/password`, {
      password: password
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}