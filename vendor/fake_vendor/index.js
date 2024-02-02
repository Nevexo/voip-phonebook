// voip-phonebook - Fake Vendor Service
// Cameron Fleming (c) 2024

import winston from 'winston';
import express from 'express';
import io from 'socket.io-client';
import { EventEmitter } from 'events';
import cors from 'cors'

let socket;

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

// -- Express Routes --
express_app.get("/", (req, res) => {
  res.status(200).json({
    "service_state": service_state,
    "entitlements": entitlements.length,
    "manifest": service_manifest
  })
})

express_app.get("/entitlement/:entitlement_id/book/:phonebook_id/json", async (req, res) => {
  // Get a JSON copy of the phonebook from the server.
  let contacts = [];

  // Get entitlement ID from URL, and resolve to access_key
  const entitlement_id = req.params.entitlement_id;
  const phonebook_id = req.params.phonebook_id;
  const entitlement = entitlements.find((entitlement) => {
    return entitlement.id == entitlement_id;
  })

  if (!entitlement) {
    return res.status(404).json({ error: "entitlement_not_found" });
  }
  const access_key = entitlement.access_key;

  const response = await socket.timeout(5000).emitWithAck("get_phonebook", {
    access_key: access_key,
    phonebook_id: phonebook_id
  }).catch(err => {
    res.send(500).json({ error: "failed_to_get_phonebook", message: err });
  })

  if (!response) {
    return res.status(500).json({ error: "failed_to_get_phonebook" });
  }

  // Interate the entries
  for (let i = 0; i < response.entries.length; i++) {
    let entry = response.entries[i];
    let contact = {};

    contact['entry_created_by'] = entry.created_by.name
    contact['fields'] = [];

    for (let field in entry.fields) {
      let field_value = entry.fields[field];
      contact['fields'].push({
        "field": {
          "id": field_value.field.id,
          "name": field_value.field.name,
        },
        "value": field_value.value
      })
    }

    contacts.push(contact);
  }

  res.status(200).json(contacts);
})

express_app.get("/entitlement/:entitlement_id/book/:phonebook_id/csv", async (req, res) => {
  // Get a CSV copy of the phonebook from the server.
  let csv = "name,mobile_number\n";
  let fields = [];

  // Get entitlement ID from URL, and resolve to access_key
  const entitlement_id = req.params.entitlement_id;
  const phonebook_id = req.params.phonebook_id;
  const entitlement = entitlements.find((entitlement) => {
    return entitlement.id == entitlement_id;
  })

  if (!entitlement) {
    return res.status(404).json({ error: "entitlement_not_found" });
  }
  const access_key = entitlement.access_key;

  const response = await socket.timeout(5000).emitWithAck("get_phonebook", {
    access_key: access_key,
    phonebook_id: phonebook_id
  }).catch(err => {
    res.send(500).json({ error: "failed_to_get_phonebook", message: err });
  })

  if (!response) {
    return res.status(500).json({ error: "failed_to_get_phonebook" });
  }

  // Interate the entries
  for (let i = 0; i < response.entries.length; i++) {
    let entry = response.entries[i];
    let contact = "";

    for (let field in entry.fields) {
      let field_value = entry.fields[field];
      if (!fields.includes(field_value.field.name)) {
        fields.push(field_value.field.name);
      }
      contact += field_value.value + ",";
    }

    csv += contact + "\n";
  }

  res.status(200).send(csv);
});

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
  socket = new io(process.env.SOCKET_URL, {
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

    await socket.emit("provision_accept");

    await test(socket);
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

const test = async (socket) => {
  // This method is called once setup is compelte.
  // let phonebooks = [];
  // await socket.timeout(5000).emit("get_available_phonebooks", {
  //   "access_key": entitlements[0].access_key
  // }, async (err, response) => {
  //   if (err) return logger.error(`Failed to get phonebooks: ${err}`);
  //   logger.info("available phonebooks: ")
  //   phonebooks = response.phonebooks
  //   for (let i = 0; i < phonebooks.length; i++) {
  //     logger.info(`Phonebook ${i}: ${phonebooks[i].id} - ${phonebooks[i].name}`)
  //   }
  // })

  // const response = await socket.timeout(5000).emitWithAck("get_available_phonebooks", {
  //   "access_key": entitlements[0].access_key
  // });

  // if (!response) {
  //   return logger.error("failed to get phonebooks");
  // }
  // const phonebooks = response.phonebooks;

  // // Get content of first phonebook
  // const response_entries = await socket.timeout(5000).emitWithAck("get_phonebook", {
  //   "access_key": entitlements[0].access_key,
  //   "phonebook_id": phonebooks[0].id
  // });

  // if (!response_entries) {
  //   return logger.error("failed to get phonebook entries");
  // }

  // console.dir(response_entries.entries, { depth: null });
}

main();