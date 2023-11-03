// voip-phonebook - Vendor Service Phonebook Entitlement
// This schema holds the configuration and API keys for a vendor service to access a phonebook.
// Creation of an entitlement is initiated by the user enabling vendor support within a phonebook.
// The entitlement is forwarded to a vendor service when it comes up.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";
import { nanoid } from 'nanoid';
import { PhonebookContainer } from "./PhonebookContainer";
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
    enum: ["setup", "invalid", "active"],
  },
  phonebook_container: {
    type: Schema.Types.ObjectId,
    ref: PhonebookContainer,
    required: true,
  },
  vendor_service: {
    type: Schema.Types.ObjectId,
    ref: VendorService,
    required: true,
  },
  configuration: {
    type: Object,
    required: true,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const VendorServiceEntitlement = model('VendorServiceEntitlement', vendorServiceEntitlementSchema);