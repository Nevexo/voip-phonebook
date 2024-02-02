// voip-phonebook - Vendor Service Schema
// Defines a vendor service module within voip-phonebook. This is a service that operates alongside the main API
// and provides vendor-specific APIs for end devices. 
// Vendor services can be registered at any point once the API is operating, and if they don't already exist in the
// database, they will be created.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';

export const vendorServiceSchema = new Schema({
  id: {
    type: String,
    default: () => nanoid(10),
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  friendly_name: {
    type: String,
    required: true,
  },
  supported_fields: {
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        required: {
          type: Boolean,
          required: true,
          default: false,
        },
        remark: {
          type: String,
          required: false,
        }
      }
    ],
    required: false,
    default: [],
  },
  site_configuration_flags: {
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        required: {
          type: Boolean,
          required: true,
          default: false,
        },
        remark: {
          type: String,
          required: false,
        }
      }
    ],
    required: false,
    default: [],
  },
  version: {
    type: String,
    required: true,
    default: "0.0.0",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  last_provision_time: {
    type: Date,
    default: Date.now,
  },
});

export const VendorService = model('VendorService', vendorServiceSchema);