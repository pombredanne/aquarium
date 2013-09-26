#!/bin/bash

# Clear old files
find locale -name "messages.js*" -exec rm {} \;

# Convert PO files to JSON
./node_modules/i18n-abide/bin/compile-json locale locale

# Make current version of the code happy
./node_modules/i18n-abide/bin/compile-mo.sh locale
