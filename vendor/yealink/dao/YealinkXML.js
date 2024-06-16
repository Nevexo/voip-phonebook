// voip-phonebook / vendors / yealink-xml
// This module provides the XML for Yealink phones to load.
// Cameron Fleming (c) 2024

import { logger, service_manifest } from "../index.js"
import xml from "xml"

export const generate_phonebook = (field_mappings, entries) => {
  // The name field mapping is used to set the name value on the phone.
  // All other field mappings will be added as Telephone entries.
  let pb = {
    YealinkIPPhoneDirectory: [
      {"Title": "Phonebook"}
    ],
  }

  for (const entry of entries) {
    // As entries arrive, they will have a "fields" array, for each of these, there's a field object which contains an
    // ID, this should be used with the field_mappings and sf to figure out which of the service fields this is.
    // After that, the value will be used, with the field from from the vendor service.

    // First, extract the "name" field.
    let phonebook_entry = [
      { "Name": (entry.fields.find(f => f.field.id === field_mappings.name).value) || "? UNKNOWN ?" }
    ]

    // Next, map all of the other fields to Telephone entries.
    for (const field of entry.fields) {
      if (field.field.id === field_mappings.name) {
        continue;
      }

      // If the value is empty, skip this field.
      if (field.value === "") {
        continue;
      }

      // Find the field in the field_mappings and get it's internal name
      // Field mapping is just "internal_name": "field_id".
      // So you'll have to reverse it 
      const internal_name = Object.keys(field_mappings).find(key => field_mappings[key] === field.field.id);

      if (internal_name === undefined) {
        logger.debug(`Field mapping not found for field ${JSON.stringify(field.field)}`);
        continue;
      }

      phonebook_entry.push({"Telephone": [
        { "_attr": { "label": internal_name } },
        field.value
      ]});


    }

    pb.YealinkIPPhoneDirectory.push({ DirectoryEntry: phonebook_entry });
  }

  return xml(pb, { declaration: true });
}