// Authentication API for VoIP Phonebook
import { api } from './index';

import { API_URL } from './index';

export class Authentication {
  user = null;

  constructor() {
    // Check for local storage API token
    if (localStorage.getItem('api_token')) {
      api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('api_token')}`;
    } else return;

  }

  async get_session() {
    // Get the current session, return session if valid, otherwise return null
    // if the session has become invalid, remove the this.user object and remove the
    // api_token from local storage
    try {
      const response = await api.get('/auth/session');
      this.user = response.data.user;
      return this.user;
    } catch (error) {
      if (error.response.status === 401) {
        this.user = null;
        localStorage.removeItem('api_token');
        return null;
      }
    }
  }

  async login(email_address, password) {
    // Attempt to login with email and password
    try {
      console.log(`attempting to login as ${email_address}`)
      const response = await api.post('/auth/session', {
        email_address,
        password
      });

      console.log("authentication success.")
      this.user = response.data.session.user;
      localStorage.setItem('api_token', response.data.session_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.session_token}`;
      
      return this.user;

    } catch (error) {
      const response = error.response.data;
      return response;
    }
  }

  async logout() {
    // Logout the user
    try {
      await api.delete('/auth/session');
      this.user = null;
      localStorage.removeItem('api_token');
      return true;
    } catch (error) {
      return false;
    }
  }
}