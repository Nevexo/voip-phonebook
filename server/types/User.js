// voip-phonebook - User Schema
// Defines a user within the voip-phonebook service.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';


export const userSchema = new Schema({
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
  email_address: {
    type: String,
    required: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  root_user: {
    type: Boolean,
    required: true,
    default: false,
  },
  remark: {
    type: String,
    required: false,
    default: "",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  last_login: {
    type: Date,
    default: Date.now,
  },
});

export const User = model('User', userSchema);