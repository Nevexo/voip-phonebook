// voip-phonebook - Vendor Service Phonebook Entitlement
// This schema holds the configuration and API keys for a vendor service to access a phonebook.
// Creation of an entitlement is initiated by the user enabling vendor support within a phonebook.
// The entitlement is forwarded to a vendor service when it comes up.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";
import { nanoid } from 'nanoid';
import { PhonebookContainer } from "./PhonebookContainer";
import { VendorService } from "./VendorService";

const vendorServiceEntitlementSchema = new Schema({
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
    type: PhonebookContainer,
    required: true,
  },
  vendor_service: {
    type: VendorService,
    required: true,
  },
  access_token: {
    type: String,
    required: true,
    default: () => nanoid(64),
    validate: {
      validator: (v) => {
        return v.length === 64;
      },
      message: (props) => `${props.value} is not a valid access token.`,
    },
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