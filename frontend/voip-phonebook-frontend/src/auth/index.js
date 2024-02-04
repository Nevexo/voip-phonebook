// voip-phonebook - Frontend Authentification

import { API_URL } from '../constants';
import axios from 'axios';

const get_token = () => {
  return "Bearer " + localStorage.getItem('session_token');
}

export const get_headers = () => {
  return {
    Authorization: get_token()
  }
}

export const get_session = async () => {
  // Get user information for this session
  try {
    const r = await axios.get(`${API_URL}/auth/session`, { headers: get_headers() });

    if (r.status === 401) {
      console.error("Session token is invalid or expired.")
      return false;
    }
  
    return r.data;
  } catch (e) {
    if (e.response.status === 401) {
      console.error("Session token is invalid or expired.")
      return false;
    } else {
      return false;
    }
  }
}

export const login = async (email_address, password) => {
  try {
    const r = await axios.post(`${API_URL}/auth/session`, { email_address, password })

    // Save session token to localStorage
    localStorage.setItem('session_token', r.data.session_token);
    localStorage.setItem('session_token_created', r.data.session.created_at);
    localStorage.setItem('session_token_expires', r.data.session.expires_at);

    console.log(`Session token created, ID: ${r.data.session.id}`)
    return true;
  } catch (e) {
    if (e.response.status === 401) {
      if (e.response.data.error == "user_does_not_exist") {
        return {
          error: "user_does_not_exist",
          message: "Username or password are incorrect."
        }
      } else {
        console.error(e.data)
        return {
          error: "unknown_error",
          message: "Authentication failed, see console."
        }
      }
    } else {
      console.error(e)
      return {
        error: "unknown_error",
        message: "Authentication failed, see console."
      }
    }
  } 
}