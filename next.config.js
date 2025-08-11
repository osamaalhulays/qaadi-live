/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: false },
  reactStrictMode: true,
  poweredByHeader: false,
  headers: async () => [
    { source: "/(.*)", headers: [
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Content-Type-Options", value: "nosniff" }
    ]}
  ]
};
export default nextConfig;
