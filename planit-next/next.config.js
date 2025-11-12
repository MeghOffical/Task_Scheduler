/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {}, // use an object (not boolean). Remove this line if you don't need serverActions
  },
}

module.exports = nextConfig