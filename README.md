# voip-phonebook
> Pending a real name.
> Under active development, final documentation is not complete.

voip-phonebook(tm) is a central phonebook service for multiple vendors of VoIP phones, starting with Yealink.

voip-phonebook offers a web frontend to users, in which they can login, view their sites, create/edit phonebooks and of course
update/create contacts.

Each supported vendor has a simple service that interacts with voip-phonebook's server, and creates the vendor-specific phonebook.

Users of the system can be assigned sites via an administrator account.

## Planned Features

- Email-based authentication
  - 12-hr registration link sent to user on creation
  - User sets password on first login
  - Password resetting via email
  - Send notification emails when sites/phonebooks added etc.
- Standard phonebook format that is vendor agnostic
  - May have additional vendor-specific meta values
- Multi-user support
  - Each user can have multiple sites assigned to them
  - Each site can have multiple phonebooks
- Multi-phonebook support
  - Each phonebook is presented separately to the frontend-services.
  - Users can create phonebooks themselves, within their site.
  - Some form of syncing between phonebooks?
- Vendor Services
  - Each vendor has a "microservice" that communicates with the phonebook API
  - Each vendor service registers with the phonebook API on startup, and opens a websocket for communication
    - Each phonebook has "vendor support" options.
      - When requested in the dashboard, the control service transitions the vendor-service into setup mode
      - The vendor service sends the required configuration to the control service.
      - An API key is generated for this service-phonebook interaction.
      - Some configuration may be automatically populated by the phonebook service (such as phonebook/site names)
      - Other configuration will be displayed on the dashboard for the user to fill in.
      - Phonebook-API stores the configuration in its database, and sends it to the vendor service.
      - The vendor service transitions into the enabled state.
      - The vendor service will return any required information for phonebook-api and the end-user, such as:
        - Enablement state
        - Fetch URL, if needed
        - Username/password information if needed.
      - The vendor service API remains connected over websocket for the following events
        - Status updates: Informs the control service of it's state for all enabled phonebooks.
        - Phonebook requests: sent when a device downloads the phonebook from the vendor service.
        - Phonebook updates: sent by the control service when a phonebook is modified, as some services may send on-demand updates to devices.
        - Configuration Updates: Sent when the user updates the service configuration or phonebook settings.
        - Service enablement change: Sent when a phonebook enables/disables a service.
        - Audit trails: Sent when the service needs has dispatched the phonebook to a device.
    - State flow for vendor service: Unavailable / Disabled -> Setup (waiting for config) -> Enabled
    - Vendor services may not necessarily be running, the dashboard should show the vendor enablement as "Unavailable" on startup
      until the vendor service starts, requests configuration and updates the enablement state.
      Enablement state of phonebook vendor services is kspt in memory to ensure it resets automatically.