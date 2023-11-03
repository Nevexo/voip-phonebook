// voip-phonebook - Phonebook Entry Schema
// This schema defines a phonebook entry, which is assigned to a phonebook group.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { PhonebookContainer } from "./Phonebook";
import { User } from "./User";

export const phonebookEntrySchema = new Schema({
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
  remark: {
    type: String,
    required: false,
  },
  fields: {
    type: Map,
    required: true,
    default: {},
  },
  phonebook_container: {
    type: Schema.Types.ObjectId,
    ref: PhonebookContainer,
    required: true,
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

export const PhonebookEntry = model('PhonebookEntry', phonebookEntrySchema);