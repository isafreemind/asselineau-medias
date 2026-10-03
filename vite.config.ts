import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'node:path';
import { archive, readContent } from './scripts/shared.ts';

function repositoryBase(): string {
  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
  return repository && !repository.endsWith('.github.io') ? `/${repository}/` : "/";
}

export default defineConfig({
  plugins: [react(), {
    name: 'media-catalog-and-archives',
    resolveId(id) { if (id === 'virtual:media-catalog') return '\0virtual:media-catalog'; },
    load(id) { if (id === '\0virtual:media-catalog') return `export default ${JSON.stringify(readContent())};`; },
    configureServer(server) {
      const mediaRoot = path.resolve('public/media');
      const settingsFile = path.resolve('content/site.json');
      server.watcher.add([mediaRoot, settingsFile]);
      const reload = (file: string) => {
        const absolute = path.resolve(file);
        if (absolute !== settingsFile && !absolute.startsWith(mediaRoot + path.sep)) return;
        const module = server.moduleGraph.getModuleById('\0virtual:media-catalog');
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload).on('unlink', reload).on('change', reload).on('addDir', reload).on('unlinkDir', reload);
      server.middlewares.use((request, response, next) => {
        const url = request.url?.split('?')[0].replace(repositoryBase(), '/');
        const match = url?.match(/^\/downloads\/([a-z0-9-]+)\.zip$/);
        if (!match) return next();
        try {
          const media = readContent().media.find(item => item.id === match[1]);
          if (!media?.parts.length) return next();
          response.setHeader('Content-Type', 'application/zip');
          response.setHeader('Content-Disposition', `attachment; filename="${media.id}.zip"`);
          response.end(Buffer.from(archive(media)));
        } catch (error) {
          response.statusCode = 500;
          response.end(error instanceof Error ? error.message : String(error));
        }
      });
    }
  }],
  base: repositoryBase(),
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true
  }
});
