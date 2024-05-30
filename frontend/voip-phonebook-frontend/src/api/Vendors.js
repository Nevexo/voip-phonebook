import { api } from './index';
import { auth } from '../main';
import { API_URL } from './index';

export const get_vendor_services = async () => {
  // Get all vendor services, requires authentication.
  try {
    const response = await api.get(`${API_URL}/vendor`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export const get_entitlement_by_site = async (site_id) => {
  // Get all entitlements for a site, requires authentication.
  try {
    const response = await api.get(`${API_URL}/site/${site_id}/entitlement`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export const delete_entitlement = async (site_id, entitlement_id) => {
  // Delete an entitlement, requires authentication.
  try {
    const response = await api.delete(`${API_URL}/site/${site_id}/entitlement/${entitlement_id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export const create_entitlement = async (site_id, vendor_service_id, field_mappings) => {
  // Create an entitlement, requires authentication.
  try {
    const response = await api.post(`${API_URL}/site/${site_id}/entitlement`, {
      vendor_service_id: vendor_service_id,
      field_mapping: field_mappings
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}