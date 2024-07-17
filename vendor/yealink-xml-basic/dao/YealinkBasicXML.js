// voip-phonebook / vendors / yealink-basic-xml
// This module provides the basic XML layout for Yealink phones.
// Cameron Fleming (c) 2024

import { logger } from "../index.js"
import xml from "xml"

const generate_phonebook_menu = (entries, field_mappings, group_name) => {
  // Create the menu structure.
  // There may be multiple menus, so they're added with group_name.
  let menu = {
    "Menu": [
      {"_attr": {"Name": group_name || "Triarom Contacts"}},
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
    menu['Menu'].push({
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

  return menu;
}

export const generate_phonebook = (field_mappings, entries) => {
  let menus = [];
  
  if (!field_mappings.group_field) {
    menus.push(generate_phonebook_menu(entries, field_mappings));

  } else {
    // Group the contacts by the group field
    // This should use the value of the group field within each entry, grouping them into arrays.
    let grouped = entries.reduce((acc, entry) => {
      const group = entry.fields.find(f => f.field.id === field_mappings.group_field).value;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(entry);
      return acc;
    }
    , {});

    for (const [group, entries] of Object.entries(grouped)) {
      menus.push(generate_phonebook_menu(entries, field_mappings, group));
    }
  }


  let pb = {
    "YealinkIPPhoneBook": [
      {
        "Title": "Triarom Contacts",
      },
      ...menus
    ]
  };

  return xml(pb, { declaration: true });
}
