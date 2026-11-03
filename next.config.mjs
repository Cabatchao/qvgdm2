import { existsSync } from 'node:fs';

if (process.env.PIZZA_ZIO_VISUAL_PACK === '1') {
  const files = ['video/zio-cuisine.mp4', ...['hero', 'dining', 'terrace'].flatMap(name =>
    ['', '-mobile'].map(suffix => 'images/zio-' + name + '-v2' + suffix + '.webp'))];
  if (files.some(file => !existsSync('public/' + file))) throw new Error('Stage the complete Pizza Zio presentation media before building.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      ],
    }];
  },
};

export default nextConfig;
