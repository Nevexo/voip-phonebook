# voip-phonebook / vendors / yealink

This service implements a rudimentary vendor service for Yealink phones using the XML "remote phonebook" scheme.

Yealink phones, like most, do support LDAP, so an LDAP service will be built and may deprecate this one in the future.

Due to the design of voip-phonebook's field management system, the entries sent to the Yealink phones in XML form
must be specified first in a configuration file for this vendor service.
This may be adjusted in the future with additional APIs within the voip-phonebook entitlements system, but currently isn't.

> As field types are sent at first startup, they can only be set once before starting the server. You'll need to
> delete vendors from the database to reset this. There's an API endpoint for it, but it's not yet made it into
> the Vue frontend.

## Setup

The default provision.yaml file provided with this source should be sufficient, though if you wish to edit it,
you must ensure the `name` field is present, or the XML page will fail. 

Check the `external_url` is updated to an IP address of FQDN that the phone's can reach, this will appear in the 
metadata section of the entitlements page on a site, the service will append the rest of the access URL, with
`<pb>` as a placeholder for the phonebook ID.

Ensure the following environment variables are set:

- `LISTEN_PORT` - Port for the HTTP server to listen on, will default to 3000
- `SOCKET_URL` - WebSocket URL to the VoIP-Phonebook Vendors Socket
- `LOG_LEVEL` - Logging level for Winston, defaults to info.
- `SOCKET_API_KEY` - A valid API key for accessing the vendors API. Should be set in the environment variables of the server.

## Add to Device

Launch the service and wait for provisioning to complete, add an entitlement on a site for this service.

Login to the phone, open Directories and add a new remote. You'll likely want to add this to your provisioning server.

- Open the site page on voip-phonebook, and find `service_phonebook_url` in the metadata section of entitlements.
- Change `<pb>` to the ID of a phonebook (you can find this by opening the phonebook, and locating `internal id`)
- Copy the URL into the phone config and name the phonebook
- Attempt to access the phonebook on the phone.
