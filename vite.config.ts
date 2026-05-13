import { createHash } from "node:crypto";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    tanstackStart({
      serverFns: {
        generateFunctionId: ({ filename, functionName }) => {
          return createHash("sha1")
            .update(`${filename}--${functionName}`)
            .digest("hex");
        },
      },
    }),
    nitro({ preset: "vercel" }),
    viteReact(),
  ],
});