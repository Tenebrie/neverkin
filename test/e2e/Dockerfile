FROM mcr.microsoft.com/playwright:v1.63.0-noble
RUN npm install -g npm@11.8.0

WORKDIR /app

COPY package.json package-lock.json* ./

# Install dependencies (npm will use package-lock.json if present)
RUN npm install

# Update playwright if Dependabot bumped the one in package.json
RUN npx playwright install

# Copy the rest of your project (including tests) into the container
COPY . .

# Default command: run your Playwright tests
CMD ["npx", "playwright", "test"]