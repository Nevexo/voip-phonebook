// voip-phonebook - Phonebook Field Schema

// This schema defines a phonebook field, which is assigned to a site, and can be used in any of the site's
// phonebooks. Three default fields are created for each site: Name, Number and Remark.
// Fields can be required in every entry, or optional.

// As fields may not necessarily line up with the field name specified by a vendor (i.e., number may be mobile_number)
// the vendor connector must translate between site fields and vendor fields.
// This is done in the vendor entitlement configuration.

// (c) Cameron Fleming 2023.

// Types must be: text, number, email, or boolean.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { Site } from "./Site";

export const phonebookFieldSchema = new Schema({
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
  type: {
    type: String,
    required: false,
    default: "text",
    enum: ["text", "number", "email", "bool"],
  },
  required: {
    type: Boolean,
    required: true,
    default: false,
  },
  site: {
    type: Schema.Types.ObjectId,
    ref: Site,
    required: true,
  },
  created_by_system: {
    type: Boolean,
    required: true,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const PhonebookField = model('PhonebookField', phonebookFieldSchema);