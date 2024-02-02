// voip-phonebook - Vendor Service Phonebook Entitlement
// This schema holds the configuration and API keys for a vendor service to access a site's phonebooks..
// Creation of an entitlement is triggered by the user enabling a vendor service for the site.
// The entitlement is forwarded to a vendor service when it comes up.
// Entitlements can be withdrawn from the vendor service, either due to pause or deletion of the service.

// Entitlements store configuration for the vendor service, the flags of which are defined by the service
// presented to the user, and then sent back to the service when the entitlement is created, or resent.

// Entitlements also store a field mapping, which maps the fields in the phonebook to the fields in the vendor.

// Finally an API key is generated for the vendor service to use to access the site.

// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";
import { nanoid } from 'nanoid';
import { Site } from "./Site";
import { VendorService } from "./VendorService";

export const vendorServiceEntitlementSchema = new Schema({
  id: {
    type: String,
    default: () => nanoid(10),
    required: true,
    unique: true,
  },
  entitlement_status: {
    type: String,
    required: true,
    default: "setup",
    enum: ["setup", "invalid", "paused", "available"],
  },
  site: {
    type: Schema.Types.ObjectId,
    ref: Site,
    required: true,
  },
  vendor_service: {
    type: Schema.Types.ObjectId,
    ref: VendorService,
    required: true,
  },
  configuration: {
    type: Object,
    required: false,
    default: {},
  },
  field_mapping: {
    type: Object,
    required: false,
    default: {},
  },
  access_key: {
    type: String,
    required: true,
    default: () => nanoid(64),
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const VendorServiceEntitlement = model('VendorServiceEntitlement', vendorServiceEntitlementSchema);