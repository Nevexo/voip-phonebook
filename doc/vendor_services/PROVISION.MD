# Vendor Service Provisioning

This documentation covers the initial provisioning (start-up) of a vendor service. 
This procedure must be followed immediately every time a vendor service starts up.

## State machine

See vendor_services/STATE.md for information on the states.

## Connect to Socket

When ready, establish a connection to the voip-phonebook vendor socket. You should set this URL
in a configuration file or, preferably, an environment variable.

You must specify the following:
- `auth.setup_api_key` must match the API key specified in `VENDOR_SERVICE_API_KEY`
- `auth.vendor_service_name` must be a string, giving a slug name to use for your vendor, don't include any fancy-ness here.

The remaining information will be sent to the server during provisioning.

The following must be completed within 30 seconds to avoid socket disconnection.

### Send `provision_request`
> Control state must be `waiting_for_provision` to enter this stage.

When able, send the `provision_request` command with the following data:
```json

{
  "name": "slug_name", // Must match the name specified in auth.vendor_service_name
  "friendly_name": "A Vendor Service", // A friendly name which will be displayed in user interfaces.
  "supported_fields": [{FIELD}], // A list of fields your vendor service supports
  "version": "0.0.1" // Your vendor service version number, if this doesn't match an entitlement, your support_fields will be rescanned
}

In `supported_fields` you must present the following:

```json

{
  "name": "name_of_field",
  "required": true | false,
  "remark": "Description of field"
}

```

```

> Note: You must change the version number if supported_fields is changed, or your service will be rejected from
> provisioning.
> Additionally, voip-phonebook allows multiple of the same vendor services to be attached at any one time, you can
> start the new version while the old one is running, if the upgrade is successful the old version will be disconnected.
> If you add new supported fields, entitlements may be disabled until reconfirmed by the user/administrator.

Expect in response:
- `provision_failed` - Your provision request was rejected, see `error` string for more information.

Following successful submission of provisioning data, the state will transition to `provisioning`.

If successful, expect `provision_entitlements` which will have in the operand:
```json

{
  "entitlements": [active_entitlements]
}

```

Where `active_entitlements` is an array of enabled entitlements for your vendor service. This array will only be
popualted if your service has previously registered, and an administrator has entitled your service to access a site.

Following `active_entitlements` expect a status transition to `provision_response_sent`

Your code can now verify the entitlements are valid with your version of code, if not, post an error in the console
and disconnect gracefully, or do not enable those specific entitlements

> TODO: Implement entitlement rejection

Once validated, emit `provision_accept` and expect a state transition to `available`