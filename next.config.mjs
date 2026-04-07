/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/textures/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "tenyearsaway.local",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "admin10.375.studio",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.glsl": {
        loaders: ["raw-loader", "glslify-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
