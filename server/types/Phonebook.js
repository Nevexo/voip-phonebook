// voip-phonebook - Phonebook Container Schema
// This schema creates the phonebook group, which is assigned to a site, and inherits its permissions.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { Site } from "./Site";

export const phonebookContainerSchema = new Schema({
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
  site: {
    type: Schema.Types.ObjectId,
    ref: Site,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const PhonebookContainer = model('PhonebookContainer', phonebookContainerSchema);