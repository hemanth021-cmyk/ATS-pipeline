#!/bin/sh
set -e

# -------------------------------------------------
# Pre‑start tasks (e.g., DB migrations)
# -------------------------------------------------
# If you have a migration script, run it here.
# Example using a raw SQL schema file:
if [ -n "$DATABASE_URL" ]; then
  echo "🔧 Running DB migrations..."
  # Adjust the path if your schema file lives elsewhere
  if [ -f "db/schema.sql" ]; then
    psql "$DATABASE_URL" -f db/schema.sql || {
      echo "❌ Migration failed – exiting."
      exit 1
    }
  else
    echo "⚠️ No db/schema.sql found – skipping migration."
  fi
fi

# -------------------------------------------------
# Finally start the actual application (passed as CMD args)
# -------------------------------------------------
exec "$@"
