import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker, { prefersMarkdown } from "../_worker.js";

const root = new URL("../", import.meta.url);
const env = {
    ASSETS: {
        async fetch(request) {
            const path = new URL(request.url).pathname;
            const file = path === "/" ? "index.html" : path.slice(1);
            try {
                const body = await readFile(new URL(file, root));
                return new Response(request.method === "HEAD" ? null : body, {
                    headers: { "Content-Type": file.endsWith("html") ? "text/html" : "application/octet-stream", "Vary": "Accept-Encoding" },
                });
            } catch {
                return new Response("Not found", { status: 404 });
            }
        },
    },
};

test("negociação respeita preferências, q=0 e o padrão HTML", () => {
    for (const accept of ["", "*/*", "text/html,*/*;q=0.8", "text/markdown;q=0", "text/markdown;q=0.2,text/html;q=0.9", "text/markdown;q=invalid"]) {
        assert.equal(prefersMarkdown(accept), false, accept);
    }
    for (const accept of ["text/markdown", "TEXT/MARKDOWN", "text/html;q=0.5,text/markdown;q=0.9", "text/html,text/markdown"]) {
        assert.equal(prefersMarkdown(accept), true, accept);
    }
});

test("HTML permanece padrão e anuncia a descrição disponível", async () => {
    const response = await worker.fetch(new Request("https://360pes.com.br/"), env);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Content-Type"), /text\/html/);
    assert.match(response.headers.get("Link"), /<\/index.md>; rel="describedby"/);
    assert.equal(response.headers.get("Vary"), "Accept-Encoding, Accept");
    assert.match(await response.text(), /<!DOCTYPE html>/);
});

test("Markdown negociado e direto retorna o conteúdo correto", async () => {
    for (const path of ["/", "/index.html", "/index.md"]) {
        const response = await worker.fetch(new Request(`https://360pes.com.br${path}`, {
            headers: { Accept: "text/markdown", "If-None-Match": '"old-html"' },
        }), env);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("Content-Type"), /text\/markdown/);
        assert.match(await response.text(), /# 360Pés/);
    }
});

test("HEAD retorna os cabeçalhos sem corpo", async () => {
    const response = await worker.fetch(new Request("https://360pes.com.br/", {
        method: "HEAD", headers: { Accept: "text/markdown" },
    }), env);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Content-Type"), /text\/markdown/);
    assert.equal(await response.text(), "");
});

test("robots e sitemap têm tipos corretos e a mesma política", async () => {
    const robots = await worker.fetch(new Request("https://360pes.com.br/robots.txt"), env);
    assert.equal(robots.status, 200);
    assert.match(robots.headers.get("Content-Type"), /text\/plain/);
    const text = await robots.text();
    assert.equal(robots.headers.get("Content-Signal"), "ai-train=yes, search=yes, ai-input=yes");
    assert.ok(text.includes(`Content-Signal: ${robots.headers.get("Content-Signal")}`));
    assert.match(text, /Sitemap: https:\/\/360pes.com.br\/sitemap.xml/);
    const sitemap = await worker.fetch(new Request("https://360pes.com.br/sitemap.xml"), env);
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get("Content-Type"), /application\/xml/);
    assert.match(await sitemap.text(), /<loc>https:\/\/360pes.com.br\/<\/loc>/);
});

test("todos os grupos de robôs permitem acesso sem bloqueios", async () => {
    const robots = await readFile(new URL("robots.txt", root), "utf8");
    assert.doesNotMatch(robots, /^Disallow:\s*\//m);
    for (const group of robots.trim().split(/\r?\n\s*\r?\n/).filter((group) => group.includes("User-agent:"))) {
        assert.match(group, /^Allow: \/\s*$/m);
    }
});

test("Markdown preserva serviços e contatos do HTML", async () => {
    const html = await readFile(new URL("index.html", root), "utf8");
    const markdown = await readFile(new URL("index.md", root), "utf8");
    for (const [, service] of html.matchAll(/<li>(.*?)<\/li>/g)) assert.ok(markdown.includes(service), service);
    for (const [, link] of html.matchAll(/href="((?:mailto:|https:\/\/wa.me\/)[^"]+)"/g)) {
        assert.ok(markdown.includes(link.replaceAll(" ", "%20")), link);
    }
});

test("arquivos estáticos e falhas não são convertidos em Markdown", async () => {
    const response = await worker.fetch(new Request("https://360pes.com.br/logotipo.png", {
        headers: { Accept: "text/markdown" },
    }), env);
    const original = await readFile(new URL("logotipo.png", root));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), original);
    const missing = await worker.fetch(new Request("https://360pes.com.br/ausente"), env);
    assert.equal(missing.status, 404);
});

test("links do WhatsApp preenchem a mensagem com acentos preservados", async () => {
    const message = "Olá! Gostaria de saber mais sobre os cuidados da 360Pés e agendar um atendimento.";
    for (const file of ["index.html", "index.md"]) {
        const content = await readFile(new URL(file, root), "utf8");
        const links = [...content.matchAll(/https:\/\/wa\.me\/[^\s"<)]+/g)];
        assert.ok(links.length > 0, file);
        for (const [link] of links) {
            const url = new URL(link);
            assert.equal(url.pathname, "/5514991270570");
            assert.equal(url.searchParams.get("text"), message);
        }
    }
});
