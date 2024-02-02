// voip-phonebook - Vendor Socket Manager
// This manager is passed the socket.io socket that will interface with the vendor services.

// Explanation:
// Vendor services provide the translation layer between voip-phonebook and the end device, as all vendors
// seem to use a different format for their phonebooks.
// The vendor service is responsible for answering queries from the end device, and where necessary will request
// the phonebook from voip-phonebook, and translate it into the format the end device expects.

// Vendor services check in for the first time using the generic API key stored within the environment variables.
// if this is not set ahead of time then vendor services will not be able to register to voip-phonebook.
// use the following command to generate a key:
// openssl rand -base64 32

// Following the first check-in, vendor services will be added to the database, and will be visible to the user of 
// a site, if the user wishes to use the vendor service, they create a vendor entitlement, in which the user will
// be prompted to fill out any configuration and field mapping required by the vendor service.
// The configuration and required fields are defined by the vendor service, and stored in the database following the
// first check-in.

// See doc/vendor_services

// A vendor service is able to update its configuration and required fields at startup, if a vendor service update
// renders an entitlement invalid, the entitlement will be paused and the user will be notified.

import { logger, vendor_service_socket } from "../index";

import { get_entitlement_for_vendor, update_entitlement_status, update_entitlement_metadata } from "./EntitlementManager";
import { get_service_by_name, create_service, update_service } from "./VendorManager";

import { CronJob } from 'cron';

import { EventEmitter } from 'events';

let connected_services = [];

export const event_emitter = new EventEmitter();

// Helper methods
const update_service_status = async (socket, status) => {
  const service = connected_services.find(service => service.socket.id === socket.id);
  if (!service) return;
  logger.info(`update_service_status: ${socket.id}: vendor service ${service.name} status changed from ${service.status} to ${status}`)
  await socket.emit("vendor_service_state_update", { state: status });
  event_emitter.emit("vendor_service_state_update", { service: service.name, state: status })
  service.status = status;
}

// Exported helpers
export const get_available_services = async () => {
  return connected_services.filter(service => service.status === "available");
}

// Event handlers

const handle_provision_request = async (socket, data) => {
  // Handle a provision request from a vendor service.
  // This is the first request a vendor service will send after connecting.

  // Check status is "waiting_for_provision"
  const service = connected_services.find(service => service.socket.id === socket.id);
  if (!service) return;

  if (service.status !== "waiting_for_provision") {
    logger.warn(`handle_provision_request: ${socket.id}: vendor service ${service.name} sent provision_request in state ${service.status}, ignoring.`)
    return;
  }

  await update_service_status(socket, "provisioning");

  // Check for required fields, name, friendly_name, supported_fields, version
  const required_fields = ["name", "friendly_name", "supported_fields", "version"];
  for (const field of required_fields) {
    if (!data[field]) {
      await update_service_status(socket, "provision_failed");
      logger.error(`handle_provision_request: ${socket.id}: vendor service did not send required field ${field}, disconnecting.`)
      socket.emit("provision_failed", { error: "missing_required_field", field: field });
      await socket.disconnect();
      return;
    }
  }

  // Basic check, ensure auth name is the name as the name provided in provisioning request.
  const vendor_service_name = socket.handshake.auth.vendor_service_name;
  if (vendor_service_name !== data.name) {
    await update_service_status(socket, "provision_failed");
    logger.error(`handle_provision_request: ${socket.id}: vendor service name in auth (${vendor_service_name}) does not match name in provisioning request (${data.name}), disconnecting.`)
    socket.emit("provision_failed", { error: "name_mismatch" });
    await socket.disconnect();
    return;
  }

  // Check the vendor service is registered
  let vendor_service = await get_service_by_name(data.name);
  if (vendor_service) {
    // Check if required_fields or configuration has changed, without a version bump.
    if (vendor_service.version === data.version) {
      // Check if supported_fields has changed
      // Remove any mongodb specific fields
      const vendor_service_fields = vendor_service.supported_fields.map(field => {
        field = {
          name: field.name,
          required: field.required,
          remark: field.remark,
        };
        return field;
      });
      if (JSON.stringify(vendor_service_fields) !== JSON.stringify(data.supported_fields)) {
        logger.warn(`handle_provision_request: ${socket.id}: vendor service ${vendor_service.name} has changed supported_fields without a version bump, disconnecting.`)
        socket.emit("provision_failed", { error: "supported_fields_changed_without_version_change" });
        await socket.disconnect();
        return;
      }
    } else {
      await update_service_status(socket, "upgrading");
      logger.info(`handle_provision_request: ${socket.id}: vendor service ${vendor_service.name} is upgrading from version ${vendor_service.version} to ${data.version}.`)

      // Check if supported_fields has changed, if they have, check all entitlements for this vendor service
      // if any entitlements are now invalid due to the change, pause them.
      if (JSON.stringify(vendor_service.supported_fields) !== JSON.stringify(data.supported_fields)) {
        logger.info(`handle_provision_request: ${socket.id}: vendor service ${vendor_service.name} has changed supported_fields, checking entitlements.`)
        const entitlements = await get_entitlement_for_vendor(vendor_service.id);
        for (const entitlement of entitlements) {
          // Check if the entitlement is valid
          const entitlement_valid = entitlement.field_mapping.every(field => data.supported_fields.some(supported_field => supported_field.name === field));
          if (!entitlement_valid) {
            logger.info(`handle_provision_request: ${socket.id}: vendor service ${vendor_service.name} has changed supported_fields, entitlement ${entitlement.id} is now invalid, marking invalid.`)
            await update_entitlement_status(entitlement.id, "invalid");
          }
        }
      }

      // Update the vendor service
      await update_service(vendor_service.name, data.friendly_name, data.supported_fields, data.version);

      // Update the vendor service in connected_services
      const service = connected_services.find(service => service.socket.id === socket.id);
      if (!service) return;
      service.version = data.version;

      await update_service_status(socket, "provisioning");
    }
  } else {
    // New vendor service, create it.
    await update_service_status(socket, "creating");
    logger.info(`handle_provision_request: ${socket.id}: vendor service ${data.name} is new, creating.`)
    vendor_service = await create_service(data.name, data.friendly_name, data.supported_fields, data.version);

    await update_service_status(socket, "provisioning");
  }

  const entitlements = await get_entitlement_for_vendor(vendor_service.id);
  const active_entitlements = entitlements.filter(entitlement => entitlement.entitlement_status === "available");

  await socket.emit("provision_entitlements", { entitlements: active_entitlements });

  logger.debug(`handle_provision_request: ${socket.id}: vendor service ${data.name} has ${active_entitlements.length} active entitlements, waiting for confirmation.`)
  await update_service_status(socket, "provision_response_sent");
}

const handle_provision_accept = async (socket, data) => {
  // The vendor service has accepted the entitlements sent to it, transition to available.
  // Check state is "provision_response_sent"
  const service = connected_services.find(service => service.socket.id === socket.id);
  if (!service) return;

  if (service.status !== "provision_response_sent") {
    logger.warn(`handle_provision_accept: ${socket.id}: vendor service ${service.name} sent provision_accept in state ${service.status}, ignoring.`)
    return;
  }

  logger.info(`handle_provision_accept: ${socket.id}: vendor service ${service.name} has accepted entitlements, transitioning to available.`)
  await update_service_status(socket, "available");
}

// Entitlement Setup Methods
export const send_entitlement_to_vendor = async (entitlement) => {
  // This method is called when a new entitlement is created. The vendor serivce
  // must accept the entitlement, it'll be updated to active and then send to the service.
  const service = connected_services.find(service => service.name === entitlement.vendor_service.name);
  if (!service) {
    logger.warn(`send_entitlement_to_vendor: vendor service ${entitlement.vendor_service.name} is not connected, this shouldn't be reachable.`)
    return;
  };

  if (service.status !== "available") {
    logger.warn(`send_entitlement_to_vendor: vendor service ${entitlement.vendor_service.name} is not available, this shouldn't be reachable.`)
    return;
  }

  // Submit the entitlement to the Vendor Service. A response will be sent under
  // entitlement_update, with an accept or deny.
  await service.socket.emit("new_entitlement", { entitlement: entitlement });
}

// Entitlement Update Methods
const handle_entitlement_update = async (socket, data) => {
  // Handles an update message inregards to a previous sent entitlement.
  // Entitlements are originally sent by send_entitlement_to_vendor.
  // Following this, assume the vendor service has accepted and will deal with the entitlement.

  const entitlement = data.entitlement_id;
  switch (data.update_type) {
    // -- Acceptance --
    case "acceptance":
      if (data.update.accepted) {
        await update_entitlement_status(entitlement, "available");
      } else {
        await update_entitlement_status(entitlement, "invalid");
      }

      logger.info(`handle_entitlement_update: ${socket.id}: ${data.update.accepted ? "accepted" : "denied"} entitlement ${entitlement}.`)
      break;

    // -- Revokation --
    case "revokation":
      if (data.update.revoked) {
        logger.info(`handle_entitlement_update: ${socket.id}: revoked entitlement ${entitlement}.`)
      } else {
        logger.warn(`handle_entitlement_update: ${socket.id}: vendor service sent invalid revokation update.`)
      }
      break;
    
    // -- Metadata update --
    case "metadata":
      logger.info(`handle_entitlement_update: ${socket.id}: vendor service sent metadata update for entitlement ${entitlement}.`)
      await update_entitlement_metadata(entitlement, data.update.metadata);
      break;
      
    default:
      logger.warn(`handle_entitlement_update: ${socket.id}: vendor service sent invalid update: ${data.update_type}.`)
      break;
  }
}

// Entitlement revokation methods
export const revoke_entitlement_from_vendor = async (entitlement) => {
  // This method is called when an entitlement is revoked. The vendor service
  // must be notified to remove the entitlement.
  const service = connected_services.find(service => service.name === entitlement.vendor_service.name);
  if (!service) {
    logger.warn(`revoke_entitlement_from_vendor: vendor service ${entitlement.vendor_service.name} is not connected, this shouldn't be reachable.`)
    return;
  };

  if (service.status !== "available") {
    // It's not important if a revokation cannot be sent, as the entitlement simply won't exist
    // when the vendor service next provisions.
    logger.debug(`revoke_entitlement_from_vendor: vendor service ${entitlement.vendor_service.name} is not available.`)
    return;
  }

  // Submit the entitlement to the Vendor Service. A response will be sent under
  // entitlement_update, with an accept or deny.
  await service.socket.emit("revoke_entitlement", { entitlement_id: entitlement.id });
}

// Socket setup
const socket_bind = async (socket) => {
  // Check the API key is set within the system.
  if (!process.env.VENDOR_SERVICE_API_KEY) {
    logger.error("VENDOR_SERVICE_API_KEY is not set, vendor services will not be able to register.")
    await socket.disconnect();
    return;
  }

  // Check the setup API key is correct
  const setup_api_key = socket.handshake.auth.setup_api_key;
  if (setup_api_key !== process.env.VENDOR_SERVICE_API_KEY) {
    logger.error(`socket_bind: ${socket.id}: connection setup aborted, key invalid.`)
    await socket.disconnect();
    return;
  }

  // Check the vendor service name is set
  const vendor_service_name = socket.handshake.auth.vendor_service_name;
  if (!vendor_service_name) {
    logger.error(`socket_bind: ${socket.id}: connection setup aborted, vendor_service_name not set.`)
    await socket.disconnect();
    return;
  }

  // Register the vendor service in connected_services, and wait for it to send provisioning request.
  connected_services.push({
    socket: socket,
    name: vendor_service_name,
    status: "waiting_for_provision",
    connection_cron: new CronJob("*/30 * * * * *", async () => {
      const service = connected_services.find(service => service.socket.id === socket.id);
      if (!service) return;
  
      if (service.status === "waiting_for_provision") {
        update_service_status(socket, "provisioning_timeout");
        logger.warn(`socket_bind: ${socket.id}: vendor service did not send provisioning request within 30 seconds, disconnecting.`)
        socket.disconnect();
      }

      service.connection_cron.stop();
    }, null, true)
  })

  logger.info(`socket_bind: ${socket.id}: vendor service ${vendor_service_name} in waiting_for_provision.`)

  // Setup cron job to check if the vendor service has sent a provisioning request within 30 seconds.
  // Delete the cron job after it runs.

  // Setup event handlers
  socket.on('disconnect', async () => {
    logger.info(`socket_bind: ${socket.id}: vendor service ${vendor_service_name} disconnected.`)
    connected_services = connected_services.filter(service => service.socket.id !== socket.id)
    event_emitter.emit("vendor_service_disconnect", { service: vendor_service_name })
  })

  socket.on('error', async (error) => {
    logger.error(`socket_bind: ${socket.id}: vendor service ${vendor_service_name} error: ${error}`)
    event_emitter.emit("vendor_service_error", { service: vendor_service_name, error: error })
  })

  // Event handlers managed by voip-phonebook
  socket.on('provision_request', async (data) => {
    await handle_provision_request(socket, data);
  });

  socket.on('provision_accept', async (data) => {
    await handle_provision_accept(socket, data);
  });

  socket.on('entitlement_update', async (data) => {
    await handle_entitlement_update(socket, data);
  })
}

export const setup_socket_handlers = () => {
  if (process.env.VENDOR_SERVICE_DEBUG) {
    logger.info("VENDOR_SERVICE_DEBUG is set, creating cron jobs.")
    // Create cron job to log connected services
    new CronJob("*/10 * * * * *", () => {
      logger.debug(`setup_socket_handlers: connected_services: ${connected_services.map(service => service.name + ":" + service.status).join(", ")}`)
    }, null, true)
  }
  vendor_service_socket.on('connection', async (socket) => {
    event_emitter.emit("vendor_service_connect", { socket: socket.id })
    logger.info(`vendor_service_socket: socket session ${socket.id} connected.`)
    await socket_bind(socket);
  })
}

export const get_vendor_service_state = (service_name) => {
  // Get the current state of a vendor service.
  // It'll exist in this module if it's conncected, and won't if it's not.
  // If it does exist in this service, the module is online, so return the status of the connection.

  const service = connected_services.find(service => service.name === service_name);
  logger.debug(`vendorsocket: request for state of ${service_name}: ${service ? service.status : "not_connected"}`)
  if (service) return service.status;
  return "not_connected";
}