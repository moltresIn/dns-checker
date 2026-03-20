import type { ResolverDefinition } from "@/lib/types";

export const RESOLVERS: ResolverDefinition[] = [
  {
    id: "cloudflare-lax",
    resolver: "Cloudflare DNS",
    provider: "Cloudflare",
    region: "North America",
    country: "United States",
    city: "Los Angeles",
    location: "Los Angeles, United States",
    server: "1.1.1.1",
    coordinates: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: "google-mtv",
    resolver: "Google Public DNS",
    provider: "Google",
    region: "North America",
    country: "United States",
    city: "Mountain View",
    location: "Mountain View, United States",
    server: "8.8.8.8",
    coordinates: { lat: 37.3861, lng: -122.0839 }
  },
  {
    id: "quad9-zrh",
    resolver: "Quad9",
    provider: "Quad9",
    region: "Europe",
    country: "Switzerland",
    city: "Zurich",
    location: "Zurich, Switzerland",
    server: "9.9.9.9",
    coordinates: { lat: 47.3769, lng: 8.5417 }
  },
  {
    id: "opendns-sfo",
    resolver: "OpenDNS",
    provider: "OpenDNS",
    region: "North America",
    country: "United States",
    city: "San Francisco",
    location: "San Francisco, United States",
    server: "208.67.222.222",
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    id: "adguard-lim",
    resolver: "AdGuard DNS",
    provider: "AdGuard",
    region: "Europe",
    country: "Cyprus",
    city: "Limassol",
    location: "Limassol, Cyprus",
    server: "94.140.14.14",
    coordinates: { lat: 34.7071, lng: 33.0226 }
  },
  {
    id: "cleanbrowsing-lis",
    resolver: "CleanBrowsing",
    provider: "CleanBrowsing",
    region: "Europe",
    country: "Portugal",
    city: "Lisbon",
    location: "Lisbon, Portugal",
    server: "185.228.168.9",
    coordinates: { lat: 38.7223, lng: -9.1393 }
  },
  {
    id: "controld-tor",
    resolver: "Control D",
    provider: "Control D",
    region: "North America",
    country: "Canada",
    city: "Toronto",
    location: "Toronto, Canada",
    server: "76.76.2.0",
    coordinates: { lat: 43.6532, lng: -79.3832 }
  },
  {
    id: "dnswatch-ber",
    resolver: "DNS.WATCH",
    provider: "DNS.WATCH",
    region: "Europe",
    country: "Germany",
    city: "Berlin",
    location: "Berlin, Germany",
    server: "84.200.69.80",
    coordinates: { lat: 52.52, lng: 13.405 }
  }
];
