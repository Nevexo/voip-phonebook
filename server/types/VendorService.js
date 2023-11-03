// voip-phonebook - Vendor Service Schema
// Defines a vendor service module within voip-phonebook. This is a service that operates alongside the main API
// and provides vendor-specific APIs for end devices. 
// Vendor services can be registered at any point once the API is operating, and if they don't already exist in the
// database, they will be created.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';

const vendorServiceSchema = new Schema({
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
  remark: {
    type: String,
    required: false,
  },
  supported_fields: {
    type: [String],
    required: true,
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const VendorService = model('VendorService', vendorServiceSchema);