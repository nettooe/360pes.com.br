const contentSignal = "ai-train=yes, search=yes, ai-input=yes";
const discoveryLinks = '</index.md>; rel="describedby"; type="text/markdown", </index.md>; rel="alternate"; type="text/markdown"';

// Require an explicit Markdown preference; ordinary browsers keep HTML.
export function prefersMarkdown(accept = "") {
    const ranges = accept.toLowerCase().split(",").map((part) => {
        const [type, ...parameters] = part.trim().split(";");
        const quality = parameters.find((value) => value.trim().startsWith("q="));
        const q = quality ? Number(quality.trim().slice(2)) : 1;
        return { type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0 };
    });
    const markdown = ranges.find((range) => range.type === "text/markdown")?.q ?? 0;
    const html = ranges.find((range) => range.type === "text/html")?.q
        ?? ranges.find((range) => range.type === "text/*")?.q
        ?? ranges.find((range) => range.type === "*/*")?.q
        ?? 0;
    return markdown > 0 && markdown >= html;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const homepage = url.pathname === "/" || url.pathname === "/index.html";
        const markdown = url.pathname === "/index.md"
            || (homepage && prefersMarkdown(request.headers.get("Accept") ?? ""));
        if (!["GET", "HEAD"].includes(request.method)) {
            return env.ASSETS.fetch(request);
        }

        const assetUrl = new URL(request.url);
        if (markdown) assetUrl.pathname = "/index.md";
        // Conditional validators belong to the selected representation only.
        const assetHeaders = new Headers(request.headers);
        if (homepage || markdown) {
            for (const name of ["if-none-match", "if-modified-since", "range", "if-range"]) {
                assetHeaders.delete(name);
            }
        }
        const asset = await env.ASSETS.fetch(new Request(assetUrl, {
            method: request.method,
            headers: assetHeaders,
        }));
        const headers = new Headers(asset.headers);
        headers.set("Content-Signal", contentSignal);
        if (homepage) {
            headers.set("Link", discoveryLinks);
            const vary = new Set((headers.get("Vary") ?? "").split(",").map((v) => v.trim()).filter(Boolean));
            if (![...vary].some((v) => v.toLowerCase() === "accept" || v === "*")) vary.add("Accept");
            headers.set("Vary", [...vary].join(", "));
            headers.set("Cache-Control", "no-store");
        }
        if (asset.status === 200) {
            if (markdown) headers.set("Content-Type", "text/markdown; charset=utf-8");
            if (url.pathname === "/robots.txt") headers.set("Content-Type", "text/plain; charset=utf-8");
            if (url.pathname === "/sitemap.xml") headers.set("Content-Type", "application/xml; charset=utf-8");
        }
        return new Response(request.method === "HEAD" ? null : asset.body, {
            status: asset.status,
            statusText: asset.statusText,
            headers,
        });
    },
};
