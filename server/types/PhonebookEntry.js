// voip-phonebook - Phonebook Entry row schema
// This schema defines a phonebook entry, which is assigned to a phonebook group.
// Each row will have columns, which contain information linked to the row.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { PhonebookContainer } from "./Phonebook";
import { User } from "./User";
import { PhonebookField } from "./PhonebookField";

export const phonebookRowSchema = new Schema({
  id: {
    type: String,
    default: () => nanoid(10),
    required: true,
    unique: true,
  },
  remark: {
    type: String,
    required: false,
  },
  fields: {
    type: [{
      "field": {
        type: Schema.Types.ObjectId,
        ref: PhonebookField,
        required: true,
      },
      "value": {
        type: String,
        required: true,
      }
    }],
    required: false, // Some fields will be required, but this is set in the field schema.
  },
  phonebook_container: {
    type: Schema.Types.ObjectId,
    ref: PhonebookContainer,
    required: true,
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const PhonebookRow = model('PhonebookRow', phonebookRowSchema);