#!/bin/bash

# Create directories
mkdir -p src/config src/common src/decorators src/filters src/guards src/interceptors src/database src/modules

# Initialize Prisma if not present (assuming user wants it in src/database or root, standard is root for schema, but user asked for src/database)
# We will just create the folder as requested for now, or move it if needed.
# For now, just ensuring directories exist.

# Generate modules, controllers, services
# Using separate commands to avoid interactive prompts of 'nest g resource'
modules=("auth" "users" "providers" "search" "appointments" "payments" "notifications" "reviews" "admin")

for mod in "${modules[@]}"; do
  echo "Generating module $mod..."
  npx nest g module modules/$mod
  npx nest g controller modules/$mod --no-spec
  npx nest g service modules/$mod --no-spec
done
