// voip-phonebook - User Session Schema
// Defines a sesison token for a user.
// (c) Cameron Fleming 2023.

import { Schema, model } from "mongoose";

import { nanoid } from 'nanoid';
import { User } from "./User.js";

const userSessionSchema = new Schema({
  id: {
    type: String,
    default: () => nanoid(10),
    required: true,
    unique: true,
  },
  user: {
    type: User,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(128),
    validate: {
      validator: (token) => token.length === 128,
      message: (props) => `${props.value} is not a valid token!`,
    },
  },
  user_agent: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expires_at: {
    type: Date,
    required: true,
    default: () => Date.now() + process.env.SESSION_TOKEN_DEFAULT_SECONDS || 2592000000, // 30 days
  },
});

export const UserSession = model('UserSession', userSessionSchema);