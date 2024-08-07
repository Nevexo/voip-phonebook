# voip-phonebook / yealink-xml-basic

This vendor service provides support for Yealink phones using the standard format XML file, rather than the version
implemented by `yealink-xml`, which is only supported on desk phones.

This services work as expected with DECT phones, which don't use the common XML format used by other phones

## The Problem

The `yealink-xml` vendor service allows you to specify custom fields, which will then be exported to the phone.
This works well on desk phones, and allows you to have custom fields in any form you like.

However, when loaded on a DECT cordless phone, the phonebook will appear as Name, Homem Mobile, and Office, not the
custom fields exported by `yealink-xml` - to avoid this, `yealink-xml-basic` only supports the aforementioned fields,
and remains compatiable with both the desk and DECT phones.

You may, of course, enable both vendor services for a site, to have a more complex setup on your desk phones,
while keeping the basic Yealink format on the DECT phones.

Maybe one day, Yealink will sort this out.

## Grouping

As the basic XML file is split into menus, this module allows grouping by setting the `group_field` to one of the
site fields. When the phonebook is generated, the items will be split by this field.

This is useful, for example, to filter by company. You could have a number of extensions within a business, and set
the grouping field to the same on all of them, then they'll appear in a single menu.