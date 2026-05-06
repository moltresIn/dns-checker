# DNS Lens

A real-time DNS propagation checker built with Next.js. Check how a DNS record is resolving across multiple public resolvers worldwide — streamed live, row by row, as results come in.

![DNS Lens](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js) ![License](https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)

## Features

- **Live WebSocket streaming** — resolver results stream in one by one as they complete, no waiting for the full batch
- **Bulk domain checks** — check up to 20 domains in a single run
- **Single domain mode** — quick lookup for a single domain
- **6 record types** — A, AAAA, CNAME, MX, NS, TXT
- **8 global resolvers** — Cloudflare, Google, Quad9, OpenDNS, AdGuard, CleanBrowsing, Control D, DNS.WATCH
- **Interactive 3D globe** — visualize resolver locations and their status on a rotatable globe
- **Propagation timeline** — track how propagation progresses over time with a live chart
- **Resolver filters** — filter by provider, region, country, or free-text search
- **Timeline export** — download propagation history as JSON
- **In-memory caching** — repeated lookups are served from cache with a 45-second TTL
- **Rate limiting** — 15 requests per minute per client
- **Retry support** — configurable retry count (0–3) per resolver query

## Tech Stack

- [Next.js 16](https://nextjs.org/) with a custom Node.js server
- [React 19](https://react.dev/)
- [TypeScript 5.8](https://www.typescriptlang.org/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) + [@react-three/drei](https://github.com/pmndrs/drei) for the 3D globe
- [ws](https://github.com/websockets/ws) for the WebSocket server
- [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client) for globe geometry

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [pnpm](https://pnpm.io/) (recommended) or npm

### Installation

```bash
git clone https://github.com/moltresIn/dns-checker.git
cd dns-checker
pnpm install
```

### Running in development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for production

```bash
pnpm build
pnpm start
```

### Windows

The dev and start scripts use `cross-env` to handle environment variables cross-platform. This is already included as a dev dependency — no extra setup needed.

## Configuration

All configuration is done via environment variables. Create a `.env.local` file in the project root:

```env
# Port to listen on (default: 3000)
PORT=3000

# Allowed WebSocket origins for production (comma-separated)
# If not set, same-host origins are allowed automatically
ALLOWED_ORIGINS=https://yourdomain.com
```

## Resolvers

The following public DNS resolvers are queried on each check:

| Resolver | Provider | Location | IP |
|---|---|---|---|
| Cloudflare DNS | Cloudflare | Los Angeles, US | 1.1.1.1 |
| Google Public DNS | Google | Mountain View, US | 8.8.8.8 |
| Quad9 | Quad9 | Zurich, Switzerland | 9.9.9.9 |
| OpenDNS | OpenDNS | San Francisco, US | 208.67.222.222 |
| AdGuard DNS | AdGuard | Limassol, Cyprus | 94.140.14.14 |
| CleanBrowsing | CleanBrowsing | Lisbon, Portugal | 185.228.168.9 |
| Control D | Control D | Toronto, Canada | 76.76.2.0 |
| DNS.WATCH | DNS.WATCH | Berlin, Germany | 84.200.69.80 |

To add or change resolvers, edit `lib/resolvers.ts`.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── dns-check/       # REST endpoint for single and bulk DNS checks
│   │   └── dns-timeline/    # REST endpoint for timeline data
│   ├── layout.tsx
│   └── page.tsx             # Main UI
├── components/
│   ├── BulkInput.tsx        # Multi-domain textarea input
│   ├── DomainInput.tsx      # Single domain input
│   ├── LiveResultsTable.tsx # Streaming results table
│   ├── RecordTypeSelect.tsx # A / AAAA / CNAME / MX / NS / TXT selector
│   ├── ResolverFilters.tsx  # Filter panel
│   ├── ResolverGlobe.tsx    # 3D globe wrapper
│   ├── ResolverGlobeScene.tsx # Three.js scene
│   ├── ResultsTable.tsx     # Static results table
│   ├── StatusBadge.tsx      # Status indicator
│   └── TimelineChart.tsx    # SVG propagation chart
├── lib/
│   ├── dns.ts               # DNS query logic, caching, rate limiting
│   ├── filtering.ts         # Resolver filter helpers
│   ├── resolvers.ts         # Resolver definitions
│   ├── security.ts          # Security headers, origin checks, body parsing
│   ├── socket.ts            # WebSocket server
│   ├── timelineStore.ts     # In-memory timeline store
│   └── types.ts             # Shared TypeScript types
└── server.ts                # Custom Next.js server entry point
```

## API

### `GET /api/dns-check`

Single domain synchronous check.

| Parameter | Type | Description |
|---|---|---|
| `domain` | string | Domain to check |
| `recordType` | string | One of: A, AAAA, CNAME, MX, NS, TXT |

### `POST /api/dns-check`

Start a bulk DNS job. Results are streamed back over WebSocket.

```json
{
  "domains": ["example.com", "openai.com"],
  "recordType": "A",
  "clientId": "<from socket:ready>",
  "clientToken": "<from socket:ready>",
  "retryCount": 1
}
```

### `GET /api/dns-timeline`

Fetch propagation timeline for a domain.

| Parameter | Type | Description |
|---|---|---|
| `domain` | string | Domain to fetch timeline for |
| `recordType` | string | Record type |

### `DELETE /api/dns-timeline`

Clear the in-memory timeline for a domain.

### WebSocket `/ws`

Connect to receive live DNS updates. On connection the server sends a `socket:ready` event with a `clientId` and `clientToken` to use in bulk check requests.

**Events received from server:**

| Event | Description |
|---|---|
| `socket:ready` | Connection established, contains `clientId` and `clientToken` |
| `dns:update` | Single resolver result for a domain |
| `dns:domain-complete` | All resolvers finished for a domain |
| `dns:job-complete` | All domains in the bulk job are done |
| `dns:error` | An error occurred during the job |

## License

[GPL-3.0](LICENSE) — you are free to use, modify, and distribute this project, but any derivative work must also be released under GPL-3.0.
