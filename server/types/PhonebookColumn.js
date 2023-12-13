// voip-phonebook - Phonebook Entry column schema
// No parent keys are stored with this value, as it is a child of a row.
// And added to the "field" array in the row.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { PhonebookEntryField } from "./PhonebookEntryField";

export const phonebookColumnSchema = new Schema({
  id: {
    type: String,
    default: () => nanoid(10),
    required: true,
    unique: true,
  },
  field: {
    type: PhonebookEntryField,
    required: true,
  },
  value: {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const PhonebookColumn = model('PhonebookColumn', phonebookColumnSchema);