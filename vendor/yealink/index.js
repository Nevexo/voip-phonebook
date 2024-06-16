// voip-phonebook - Yealink XML Phonebook Service
// Cameron Fleming (c) 2024

import winston from 'winston';
import express from 'express';
import io from 'socket.io-client';
import cors from 'cors'
import fs from 'fs';
import YAML from 'yaml';

import { generate_phonebook } from './dao/YealinkXML.js';

let socket;

// Initial service manifest, will be updated with supported_fields once the yaml file is loaded.
export let service_manifest = {
  name: "yealink-xml",
  friendly_name: "Yealink XML Vendor Service",
  version: "1.0.0",
  supported_fields: []
}

let service_meta = {}

export let service_state = "unregistered";
export let entitlements = [];

// Method to update & announce changes to the service status
export const update_status = (status) => {
  logger.info(`Service state transitioned from ${service_state} to ${status}.`);
  service_state = status;
}

// Setup Winston logger
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

const app = express();
app.use(cors());

// Default route provides the manifest as JSON.
app.get("/", (req, res) => {
  res.status(200).json({
    "service_state": service_state,
    "entitlements": entitlements.length,
    "manifest": service_manifest
  })
})

// Handle requests for the phonebook from Yaellink phones.
app.get("/entitlement/:eid/pb/:pib.xml", async (req, res) => {
  // Check if the entitlement exists
  const eid = req.params.eid;
  const pib = req.params.pib;
  const entitlement = entitlements.find(e => e.id == eid);

  if (entitlement == undefined) {
    logger.error(`Entitlement ${eid} not found.`);
    res.status(404).send("Entitlement not found.");
    return;
  }

  // Request the phonebook from voip-phonebook
  const access_key = entitlement.access_key;

  logger.debug(`fetching phonebook for entitlement ${eid} with access key ${access_key}.`)

  const response = await socket.timeout(5000).emitWithAck("get_phonebook", {
    access_key: access_key,
    phonebook_id: pib
  }).catch(err => {
    logger.error(`Failed to get phonebook for entitlement ${eid}, err: ${err || "n/a"}`)
    res.send(500).json({ error: "failed_to_get_phonebook", message: err });
  })

  logger.debug(`server response: ${JSON.stringify(response)}`)
  if (!response.entries) {
    logger.error(`Failed to get phonebook for entitlement ${eid}, no entities.`)
    return res.status(500).json({ error: "failed_to_get_phonebook" });
  }

  // Generate the phonebook XML
  try {
    const phonebook = generate_phonebook(entitlement.field_mapping, response.entries);
    res.set('Content-Type', 'text/xml');
    res.status(200).send(phonebook);
  } catch (err) {
    logger.error("Failed to generate phonebook XML.")
    logger.error(err);
    res.status(500).send("Failed to generate phonebook XML.");
  }
})

const main = async () => {
  logger.info("Yealink XML Vendor Service")
  logger.info("Cameron Fleming (c) 2024")

  // Check for required environment varablies
  if (!process.env.SOCKET_URL) {
    logger.error("SOCKET_URL not set. Please set to the URL of voip-phonebook server.")
    process.exit(1)
  }

  if (!process.env.SOCKET_API_KEY) {
    logger.error("SOCKET_API_KEY not set. Please set to the API key of voip-phonebook server.")
    process.exit(1)
  }

  // Check for, and load YAML provisioning file
  let provision;
  try {
    const file = await fs.promises.readFile('provision.yaml', 'utf8');
    provision = YAML.parse(file);
    logger.info("Provisioning file loaded successfully.")
  } catch (err) {
    logger.error("Failed to load provisioning file.")
    logger.error(err);
  }

  if (provision['fields'] === undefined) {
    logger.error("No fields found in provisioning file.")
    process.exit(1);
  }

  if (provision['service'] === undefined) {
    logger.error("No service metadata found in provisioning file.")
    process.exit(1);
  }

  // Parse service metadata
  if (provision['service']['external_url'] == undefined) {
    logger.error("Service metadata is missing an external_url.")
    process.exit(1);
  }

  service_meta['external_url'] = provision['service']['external_url'];

  // Parse all fields from provisioning file
  for (const field in provision['fields']) {
    const f = provision['fields'][field];
    
    // Some fields may have the "required" property, if it's not there, default to false.
    if (f['required'] == undefined) {
      logger.warn(`Field ${field} is missing a required property, defaulting to false.`)
      f['required'] = false;
    }

    // The remark field is optional, if it's not there, default to empty string.
    if (f['remark'] == undefined) {
      f['remark'] = "";
    }

    // Add the field to the service manifest
    service_manifest.supported_fields.push({
      "name": f['name'],
      "required": f['required'],
      "remark": f['remark']
    })
  }

  logger.info(`Successfully registered ${service_manifest.supported_fields.length} fields.`)

  // Contact voip-phonebook server
  socket = new io(process.env.SOCKET_URL, {
    auth: {
      setup_api_key: process.env.SOCKET_API_KEY,
      vendor_service_name: service_manifest.name
    },
    autoConnect: true,
    reconnection: true,
  })

  // Handle disconnection event
  socket.on('disconnect', () => {
    logger.warn("Disconnected from voip-phonebook server, socket.io will attempt to reconnect.")
    update_status("unregistered");
  })

  // Handle general events from server
  socket.on('vendor_service_state_update', (operand) => {
    update_status(operand.state);
  })

  socket.on('provision_failed', async (operand) => {
    logger.error(`Provision failed: ${operand.error} - exiting.`)
    process.exit(1)
  })

  // Handle multi-entitlements loading (called on initial registration)
  socket.on("provision_entitlements", async (operand) => {
    // TODO: Some more error checking here, while the server should only be sending sane information, you can't
    // trust anybody.
    entitlements = operand.entitlements;

    // Write each entitlement to the log.
    for (let i = 0; i < entitlements.length; i++) {
      logger.info(`Entitlement ${i}: ${entitlements[i].id} for site ${entitlements[i].site.name}`)

      // Update the external URL for each entitlement
      if (entitlements[i].metadata == undefined) {
        entitlements[i].metadata = {}
      }
      entitlements[i].metadata['load_time'] = new Date().toISOString();
      entitlements[i].metadata['service_phonebook_url'] = service_meta['external_url'] + `/entitlement/${entitlements[i].id}/pb/<id>.xml`;
      await socket.emit("entitlement_update", {
        "update_type": "metadata",
        "entitlement_id": entitlements[i].id,
        "update": {
          "metadata": entitlements[i].metadata
        }
      })
    }

    // Submit acceptance to server
    logger.info("Accepting provision.")
    await socket.emit("provision_accept");
  })

  // Handle additional entitlements being added
  socket.on('new_entitlement', async (operand, callback) => {
    // TODO: again, some sanity checking needed.
    entitlements.push(operand.entitlement);

    // Log to console
    logger.info(`New entitlement ${operand.entitlement.id} for site ${operand.entitlement.site.name}`)

    // Accept the new entitlement
    await callback({accepted: true})

    // Update the external URL for the new entitlement
    await socket.emit("entitlement_update", {
      "update_type": "metadata",
      "entitlement_id": operand.entitlement.id,
      "update": {
        "metadata": {
          "load_time": new Date().toISOString(),
          "service_phonebook_url": service_meta['external_url'] + `/entitlement/${operand.entitlement.id}/pb/<id>.xml`
        }
      }
    })

    logger.info("Entitlement load & update complete.")
  });

  // Handle entitlement revocation requests from the server.
  socket.on('revoke_entitlement', async (operand, callback) => {
    logger.info(`Received revocation for entitlement: ${operand.entitlement_id}`)
    
    // Delete the entitlement from the entitlements array.
    entitlements = entitlements.filter((entitlement) => {
      return entitlement.id != operand.entitlement_id
    })

    // Acknowledge the revocation.
    await callback({"acknowledged": true});
  })

  // Initial connection requests.
  // Once a connection is opened, immediately request provisioning information.
  // Register with voip-phonebook server
  socket.on('connect', async () => {
    logger.debug("Connected to voip-phonebook server.")
    await socket.emit('provision_request', service_manifest)
  })

  // Bring up the express server
  // Start express server
  if (!process.env.LISTEN_PORT) {
    logger.warn("LISTEN_PORT not set, using 3000.")
  }

  app.listen(process.env.LISTEN_PORT || 3000, () => {
    logger.info(`API server listening on port ${process.env.LISTEN_PORT || 3000}.`)
  })
}

main();