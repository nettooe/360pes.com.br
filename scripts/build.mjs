import { mkdir, copyFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("dist/", root);
await mkdir(output, { recursive: true });
for (const file of ["index.html", "index.md", "estilos.css", "logotipo.png", "robots.txt", "sitemap.xml", "_worker.js", "_routes.json"]) {
    await copyFile(new URL(file, root), new URL(file, output));
}
console.log("Site preparado em dist/ para Cloudflare Pages.");
