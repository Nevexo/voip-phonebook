// voip-phonebook API Constants

// export const API_URL = 'https://api.contacts.triaromconnect.net';
export const API_URL = 'http://localhost:8080'
export const API_TARGET_VERSION = '0.0.1';

import axios from 'axios';

// Deal with cors
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, remember-me',
    'Access-Control-Allow-Credentials': 'true'
  }
});