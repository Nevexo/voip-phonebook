// voip-phonebook / vendors / yealink-basic-xml
// This module provides the basic XML layout for Yealink phones.
// Cameron Fleming (c) 2024

import { logger } from "../index.js"
import xml from "xml"

export const generate_phonebook = (field_mappings, entries) => {
  let pb = {
    "YealinkIPPhoneBook": [
      {
        "Title": "Triarom Contacts",
      },
      {
        "Menu": [{"_attr": {"Name": "Triarom Contacts"}}]
      }
    ]
  };

  for (const entry of entries) {
    // As entries arrive, they will have an entries array and field mappings array. Each entry must be mapped
    // to the correct fields before being mapped to the XML structure. The mapping is not provided by the
    // entitlement server, yet.

    // Get the contact name
    const name = ( entry.fields.find(f => f.field.id === field_mappings.name) ) || undefined;

    // Get mobile number
    const mobile = entry.fields.find(f => f.field.id === field_mappings.mobile) || undefined;

    // Get office number
    const office = entry.fields.find(f => f.field.id === field_mappings.office) || undefined;

    // Get other number
    const other = entry.fields.find(f => f.field.id === field_mappings.other) || undefined;

    // Create the contact object
    pb['YealinkIPPhoneBook'][1]['Menu'].push({
      "Unit": {
        "_attr": {
          "Name": name ? name.value : "UNKNOWN",
          "Phone1": office ? office.value : "",
          "Phone2": mobile ? mobile.value : "",
          "Phone3": other ? other.value : ""
        }
      }
    })
  }

  return xml(pb, { declaration: true });
}
