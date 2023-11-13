// voip-phonebook - A microservice-ish based phonebook platform
// Cameron Fleming (c) 2023

import winston from 'winston';
import express from 'express';
import { Server } from "socket.io";
import { EventEmitter } from 'events';
import cors from 'cors'

import mongoose from 'mongoose';

// Setup Winston logger
// Log to console and logs/combined.log
// Log errors to console and logs/error.log
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
})

import { get_user_safe, get_all_users, create_user } from './auth/Users';

// Import routers
import { router as authentication_router } from './routes/Authentication'
import { router as user_maangement_router } from './routes/UserManagement'
import { router as site_management_router } from './routes/Site'

// Setup socket.io and export the instance
export const vendor_service_socket = new Server()
export const frontend_service_socket = new Server()

// Setup event emitter and export the instance
export const event_emitter = new EventEmitter()

// Setup express app
const express_app = express()

// Setup express middleware
express_app.use(cors())
express_app.use(express.json())

const main = async () => {
  // Read package version from package.json
  const package_version = require('./package.json').version
  logger.info(`voip-phonebook server v${package_version}.`)
  logger.info(`(c) 2023 Cameron Fleming.`)

  // Validate other env vars
  if (!process.env.SESSION_TOKEN_DEFAULT_SECONDS) {
    logger.warn("SESSION_TOKEN_DEFAULT_SECONDS not set, using 2592000000 (30 days).")
  } else if (process.env.SESSION_TOKEN_DEFAULT_SECONDS < 3600) {
    logger.warn("SESSION_TOKEN_DEFAULT_SECONDS set to less than 3600 (1 hour), this is not allowed.")
    process.exit(1)
  }

  if (!process.env.MONGO_URI) {
    logger.warn("MONGO_URI not set, using mongodb://localhost:27017/phonebook.")
  }

  // Setup mongoose connection.
  logger.debug("mongoose: connecting to database")
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/phonebook')
  logger.debug("mongoose: connected to database")

  // Check if any users exist
  const users = await get_all_users()

  if (users.length === 0) {
    console.log("\n\n")
    logger.warn("=== -- FIRST TIME RUN -- ===")
    logger.info("Thank you for choosing voip-phonebook!")
    logger.info("This is your first time running voip-phonebook, so we need to create a root user.")
    logger.info("The root user is the first user created, and has access to all endpoints.")
    logger.warn("IT IS HIGHLY RECOMMENDED THAT YOU IMMEDIATELY CREATE YOUR OWN USER AFTER LOGGING IN.")
    logger.info("Creating root user...\n")

    const random_password = Math.random().toString(36).slice(-8)

    await create_user(
      "root",
      "root@localhost",
      random_password,
      true,
      "Default user created on bootstrap of voip-phonebook, it is highly recommended to create your own user, \
      and delete the root.").catch((err) => {
        logger.error(err)
        process.exit(1)
      })
    
    logger.info(`Root user created!`)
    logger.info("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-")
    logger.warn("THIS PASSWORD IS ONLY SHOWN ONCE, MAKE SURE TO SAVE IT!")
    logger.info("Use the following account to login to your voip-phonebook frontend for the first time.")
    console.log("Username: root")
    console.log(`Password: ${random_password}`)
    logger.info("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-")

    logger.info("voip-phonebook will continue to start. Have a lovely day.")
    console.log("\n\n")
  }

  // Start socketio servers.
  if (!process.env.VENDOR_SERVICE_SOCKET_PORT) {
    logger.warn('VENDOR_SERVICE_SOCKET_PORT not set, using 3000.')
    process.env.VENDOR_SERVICE_SOCKET_PORT = '3000'
  }

  if (!process.env.FRONTEND_SERVICE_SOCKET_PORT) {
    logger.warn('FRONTEND_SERVICE_SOCKET_PORT not set, using 3001.')
    process.env.FRONTEND_SERVICE_SOCKET_PORT = '3001'
  }

  logger.debug("vendor_socket: started on port " + process.env.VENDOR_SERVICE_SOCKET_PORT)
  await vendor_service_socket.listen(process.env.VENDOR_SERVICE_SOCKET_PORT)

  logger.debug("frontend_socket: started on port " + process.env.FRONTEND_SERVICE_SOCKET_PORT)
  await frontend_service_socket.listen(process.env.FRONTEND_SERVICE_SOCKET_PORT)

  // Load routes
  logger.debug("router: preparing routes")
  express_app.use('/auth', authentication_router)
  express_app.use('/user', user_maangement_router)
  express_app.use('/site', site_management_router)
  
  // Start express server
  if (!process.env.API_LISTEN_PORT) {
    logger.warn('API_LISTEN_PORT not set, using 8080.')
    process.env.API_LISTEN_PORT = '8080'
  }

  logger.debug("router: starting on port " + process.env.API_LISTEN_PORT)
  await express_app.listen(process.env.API_LISTEN_PORT)

  logger.info("voip-phonebook server ready.")
}

main().catch((err) => {
  logger.error(err)
  process.exit(1)
})