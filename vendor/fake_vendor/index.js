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

    logger.info("Received entitlements:")
    for (let i = 0; i < entitlements.length; i++) {
      logger.info(`Entitlement ${i}: ${entitlements[i].id} for site ${entitlements[i].site.name}`)

      // Update existing metadata, this is just a test, but proves that allowing 
      // automatic upgrading is possible within vendor services.
      entitlements[i].metadata['load_time'] = new Date().toISOString();
      await socket.emit("entitlement_update", {
        "update_type": "metadata",
        "entitlement_id": entitlements[i].id,
        "update": {
          "metadata": entitlements[i].metadata
        }
      })
    }

    logger.info(`Provisioned with ${entitlements.length} entitlements, sending acceptance.`);

    socket.emit("provision_accept");
  })

  socket.on('new_entitlement', async (operand, callback) => {
    // Handle a new entitlement being sent to the service.
    // Entitlements must be accepted or rejected, they are unusable without acceptance, so the server
    // will not accept the access_key.

    logger.info(`Received new entitlement: ${operand.entitlement.id} for site ${operand.entitlement.site.name} - accepting.`)
    // The dummy provider simply accepts all entitlements, this is fairly safe as mappings are checked by the
    // server, but they should be checked again by the server, in case of manifest mismatch.
    // A failure at this point is pretty fatal, as the manifest must be wrong to allow a fault to occur here.

    // Install the entitlement into the entitlements array.
    entitlements.push(operand.entitlement);

    // Accept the entitlement.
    await callback({accepted: true})

    // Submit some blank metadata
    await socket.emit("entitlement_update", {
      "update_type": "metadata",
      "entitlement_id": operand.entitlement.id,
      "update": {
        "metadata": {
          "acceptance_time": new Date().toISOString(),
          "service_phonebook_url": `https://dummy.vendor.triaromconnect.net/${operand.entitlement.id}/[phonebook]`,
        }
      }
    })
  })

  socket.on('revoke_entitlement', async (operand, callback) => {
    // The server is revoking an existing entitlement, remove it if it exists.
    logger.info(`Received revocation for entitlement: ${operand.entitlement_id}`)
    
    // Delete the entitlement from the entitlements array.
    entitlements = entitlements.filter((entitlement) => {
      return entitlement.id != operand.entitlement_id
    })

    // Acknowledge the revocation.
    await callback({"acknowledged": true});
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