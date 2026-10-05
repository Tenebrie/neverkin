# Neverkin Load Testing Suite

Load testing suite using [k6](https://k6.io/) for the Neverkin application.

k6 has native TypeScript support, so no build step is needed.

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Install Types (for IDE support)

```bash
cd load-tests
npm install
```

## Configuration

Set environment variables before running tests:

```bash
# Required
export BASE_URL="https://timelines.tenebrie.com"  # or http://localhost:5173 for local
```

## Running Tests

### Local (requires k6 installed)

```bash
# Run smoke test
npm run test:smoke
# or directly
k6 run src/smoke.ts

# Run load test
npm run test:load

# Run stress test
npm run test:stress

# Run WebSocket test
npm run test:websocket

# Run soak test (30+ minutes)
npm run test:soak
```

### Docker (no local k6 required)

```bash
npm run docker:smoke
npm run docker:load
npm run docker:stress
npm run docker:websocket
npm run docker:soak

# With custom BASE_URL
BASE_URL=http://host.docker.internal:5173 npm run docker:smoke
```

## Test Types

| Test | Duration | Users | Purpose |
|------|----------|-------|---------|
| Smoke | 30s | 1 | Quick validation |
| Load | 7min | 25→50 | Normal traffic simulation |
| Stress | 8min | 50→200 | Find breaking point |
| WebSocket | 5min | 10→50 | Test Calliope real-time |
| Soak | 30min | 30 | Detect memory leaks |

## Key Metrics

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| `http_req_duration` (p95) | < 200ms | < 500ms | > 1s |
| `http_req_failed` | 0% | < 1% | > 5% |
| `ws_connect_time` | < 100ms | < 300ms | > 1s |
| `checks` pass rate | 100% | > 95% | < 90% |

## Project Structure

```
load-tests/
├── src/
│   ├── config.ts      # Shared configuration
│   ├── helpers.ts     # API helper functions
│   ├── smoke.ts       # Smoke test
│   ├── load.ts        # Load test
│   ├── stress.ts      # Stress test
│   ├── websocket.ts   # WebSocket test
│   └── soak.ts        # Soak test
├── docker-compose.yml
├── tsconfig.json
└── package.json
```
