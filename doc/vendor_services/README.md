# Vendor Services Documentation

Vendor serivces provide the translation layer between voip-phonebook and the phone's
vendor phonebook platform.

Vendor Services are attached to the main server with socket.io WebSockets, to provide real-time
control information.

Vendor Services should store no information on disk about the phonebooks, they may have a configuration
file, but this must be for the service as a whole. The configuration will be sent on automatically after
registration.

## Entitlements

Each site has a list of entitlements, these specify which vendor services may access that particular
site's phonebook(s)

Entitlements are enabled via the API and provide configuration details to the Vendor Service.

When registering with the server, a vendor service will inform the server of any configruation it needs
to provide access to phonebooks, if any.

Entitlments are sent to Vendor Services when they start up and connect to the server, or when they're
added by a user.

