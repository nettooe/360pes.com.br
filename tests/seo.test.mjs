import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const canonical = "https://360pes.com.br/";
const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];

test("metadados descrevem o serviço e a cidade sem bloquear indexação", () => {
    assert.match(title, /Podologia Domiciliar em Botucatu/);
    assert.ok(description.includes("domiciliar e hospitalar em Botucatu"));
    assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
    assert.ok(html.includes(`<meta property="og:description" content="${description}">`));
    const robotsTags = [...html.matchAll(/<meta\s+[^>]*name="(?:robots|googlebot)"[^>]*>/gi)];
    for (const [tag] of robotsTags) assert.doesNotMatch(tag, /noindex|content="none"/i);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
});

test("sitemap e página usam o mesmo endereço canônico", async () => {
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    const sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
    assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]), [canonical]);
    const robots = await readFile(new URL("robots.txt", root), "utf8");
    assert.ok(robots.includes(`Sitemap: ${canonical}sitemap.xml`));
});

test("logotipo tem descrição própria sem rótulo duplicado no contêiner", () => {
    assert.match(html, /<img[^>]+alt="360Pés Podologia"/);
    assert.doesNotMatch(html, /class="abertura-arte"[^>]*role="img"/);
});

test("dados estruturados referenciam entidades e serviços reais da página", () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1);
    const schema = JSON.parse(blocks[0][1]);
    assert.equal(schema["@context"], "https://schema.org");
    const graph = schema["@graph"];
    for (const type of ["Organization", "WebSite", "WebPage", "Service"]) {
        assert.ok(graph.some((node) => node["@type"] === type), type);
    }
    const ids = new Set(graph.map((node) => node["@id"]));
    function checkReferences(value) {
        if (!value || typeof value !== "object") return;
        if (value["@id"] && !value["@type"]) assert.ok(ids.has(value["@id"]), value["@id"]);
        for (const child of Object.values(value)) checkReferences(child);
    }
    checkReferences(schema);
    const organization = graph.find((node) => node["@type"] === "Organization");
    assert.equal(organization.email, "atendimento@360pes.com.br");
    assert.equal(organization.telephone.replace(/\D/g, ""), "5514991270570");
    assert.equal(organization.url, canonical);
    const service = graph.find((node) => node["@type"] === "Service");
    const names = service.hasOfferCatalog.itemListElement.map((offer) => offer.itemOffered.name);
    const visibleServices = [...html.matchAll(/<li>(.*?)<\/li>/g)].map((match) => match[1]);
    assert.deepEqual(names.toSorted(), visibleServices.toSorted());
});
