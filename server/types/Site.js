// voip-phonebook - Site Schema
// Defines a site within the voip-phonebook service.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { User } from "./User";

const siteSchema = new Schema({
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
  authorised_users: {
    type: [User],
    required: true,
    default: [],
  },
  created_by: {
    type: User,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const Site = model('Site', siteSchema);