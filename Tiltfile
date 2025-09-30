# Root Tiltfile for GitHub Dashboard dev

# Bring up Postgres via docker compose
# This defines a Tilt resource named 'postgres'
docker_compose('github-dashboard/docker-compose.yml')

# API (NestJS) - depends on postgres
local_resource(
  'github-dashboard-api',
  serve_cmd='npx nx serve api',
  deps=['packages/github-dashboard/api/src'],
  resource_deps=['postgres'],
  env={
    'DATABASE_URL': 'postgresql://postgres:password@localhost:5432/github_dashboard',
    'PORT': '3001'
  }
)

# Web (React Vite) - depends on api
local_resource(
  'github-dashboard-web',
  serve_cmd='npx nx serve web',
  deps=['packages/github-dashboard/web/src'],
  resource_deps=['github-dashboard-api']
)

# Aggregate resource so you can run: `tilt up github-dashboard`
# This will bring up postgres, api, and web together
local_resource(
  'github-dashboard',
  serve_cmd='echo "GitHub Dashboard stack running" && sleep 3600000',
  resource_deps=['postgres', 'github-dashboard-api', 'github-dashboard-web']
)
