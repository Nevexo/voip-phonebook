// voip-phonebook - Fake Vendor Service
// Cameron Fleming (c) 2024

import winston from 'winston';
import express from 'express';
import io from 'socket.io-client';
import { EventEmitter } from 'events';
import cors from 'cors'

const service_manifest = {
  name: "fakevendor",
  friendly_name: "Fake Vendor Service",
  version: "0.0.1",
  supported_fields: [
    {
      "name": "first_name",
      "required": true,
      "remark": "First name of the contact."
    }, 
    {
      "name": "last_name",
      "required": false,
      "remark": "Last name of the contact."
    }, 
    {
      "name": "phone_number",
      "required": false,
      "remark": "Phone number of the contact."
    }
  ],
}

let service_state = "unregistered";
let entitlements = [];

// Setup Winston logger
// Log debug/info to console only.
// Log errors to console and logs/error.log

export const update_status = (status) => {
  logger.info(`Service state transitioned from ${service_state} to ${status}.`);
  service_state = status;
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
})

const express_app = express();
express_app.use(cors());

const main = async () => {
  logger.info("Fake Vendor Service v0.0.1")
  logger.info("(c) 2024 Cameron Fleming")

  if (!process.env.SOCKET_URL) {
    logger.error("SOCKET_URL not set. Please set to the URL of voip-phonebook server.")
    process.exit(1)
  }

  if (!process.env.SOCKET_API_KEY) {
    logger.error("SOCKET_API_KEY not set. Please set to the API key of voip-phonebook server.")
    process.exit(1)
  }

  // Connect to Socket.io server using SOCKET_URL
  const socket = new io(process.env.SOCKET_URL, {
    auth: {
      setup_api_key: process.env.SOCKET_API_KEY,
      vendor_service_name: service_manifest.name
    },
    autoConnect: true
  })

  socket.on('vendor_service_state_update', (operand) => {
    update_status(operand.state);
  })

  socket.on('provision_failed', async (operand) => {
    logger.error(`Provision failed: ${operand.error} - exiting.`)
    process.exit(1)
  })

  socket.on('provision_entitlements', async (operand) => {
    entitlements = operand.entitlements;
    logger.debug(`Received entitlements: ${entitlements}`)
    logger.info(`Provisioned with ${entitlements.length} entitlements, sending acceptance.`);

    socket.emit("provision_accept");
  })

  // Register with voip-phonebook server
  socket.on('connect', async () => {
    logger.debug("Connected to voip-phonebook server.")
    await socket.emit('provision_request', service_manifest)
  })

  socket.on('disconnect', () => {
    logger.error("Disconnected from voip-phonebook server. Terminating.")
    logger.info("NOTE TO DEVELOPERS: This isn't the correct response, this is a test module.")
    if (service_state == "unregistered") {
      logger.info(`IMPORTANT: State never transitioned, it's likely your API_KEY is invalid: ${process.env.SOCKET_API_KEY}`)
    }
    process.exit(1)
  })

  // Start express server
  if (!process.env.LISTEN_PORT) {
    logger.warn("LISTEN_PORT not set, using 3000.")
  }

  express_app.listen(process.env.LISTEN_PORT || 3000, () => {
    logger.info(`API server listening on port ${process.env.LISTEN_PORT || 3000}.`)
  })
}

main();