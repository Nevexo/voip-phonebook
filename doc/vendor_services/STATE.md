# State Tracking in Vendor Services

Your Vendor Service should expect the following "statuses" while operating
- `waiting_for_provision` - Not ready to serve, waiting for provision process to start.
- `provisioning` - Provisioning sequence in progress.
- `provision_failed` - The provisioning process was unsuccessful. A disconnection will follow.
- `upgrade` - voip-phonebook is upgrading your vendor service, standby.
- `available` - Your vendor service is welcome to respond to requests, the voip-phonebook server will respond.

## State Update Monitoring

Your vendor service should keep track of it's status, voip-phonebook will emit `vendor_service_state_update`
events whenever it's internal state changes. When this happens, expect the following data:

```json

{
  "state": "state_name"
}

```