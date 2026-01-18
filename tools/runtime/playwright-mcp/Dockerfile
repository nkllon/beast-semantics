FROM mcr.microsoft.com/playwright:v1.48.2-jammy

WORKDIR /work

# Install Playwright MCP server
RUN npm -g i @playwright/mcp && \
    npm -g cache clean --force

# Browsers are preinstalled in the base image
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Default entrypoint runs the MCP server; override with `docker compose run` args as needed
ENTRYPOINT ["npx","--yes","@playwright/mcp"]


