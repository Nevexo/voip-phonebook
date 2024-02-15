// voip-phonebook API Constants

export const API_URL = 'https://api.contacts.triaromconnect.net';
export const API_TARGET_VERSION = '0.0.1';

import axios from 'axios';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});