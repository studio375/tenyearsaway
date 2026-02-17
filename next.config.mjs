/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "tenyearsaway.local",
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
