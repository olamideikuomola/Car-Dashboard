import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the build runs from any folder (Vercel, an Artifact, a file share).
  base: "./",
});
