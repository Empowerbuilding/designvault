import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "designvault/styles.css": path.resolve(__dirname, "../../src/styles/designvault.css"),
    },
  },
  css: {
    transformer: "postcss",
  },
  build: {
    cssMinify: false,
  },
  server: {
    port: 5173,
  },
});
