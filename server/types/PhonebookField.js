// voip-phonebook - Phonebook Field Schema
// This schema defines a phonebook field, which is assigned to a phonebook group.
// Phonebook fields shouldn't include the contact name or remark, as these are defined in the phonebook entry.
// Two defaults will be created whenever a new phonebook is created: home & mobile.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { PhonebookContainer } from "./Phonebook";

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
  phonebook_container: {
    type: Schema.Types.ObjectId,
    ref: PhonebookContainer,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const PhonebookField = model('PhonebookField', phonebookFieldSchema);