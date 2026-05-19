/** @type {import('next').NextConfig} */
const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? '4000';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? `http://127.0.0.1:${apiPort}/api/v1`;
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'info@omansale.om';
const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+968 2456 7890';

const nextConfig = {
  transpilePackages: ['@oman-sale/ui'],
  // Ensure NEXT_PUBLIC_* is embedded in the client bundle (no proxy)
  env: {
    NEXT_PUBLIC_API_URL: apiBaseUrl,
    NEXT_PUBLIC_API_PORT: apiPort,
    NEXT_PUBLIC_CONTACT_EMAIL: contactEmail,
    NEXT_PUBLIC_CONTACT_PHONE: contactPhone
  }
};

export default nextConfig;
