# Site 360Pés

Site estático com suporte a consultas de agentes na Cloudflare Pages.

## Desenvolvimento e verificação

Requer Node.js 22 ou superior. Não há dependências para instalar.

```powershell
npm test
npm run build
```

O build copia apenas os arquivos de publicação para `dist/`. Os testes verificam negociação HTTP, tipos de conteúdo, política e correspondência dos serviços e contatos entre HTML e Markdown.

Para testar a integração Cloudflare localmente com Wrangler:

```powershell
npx wrangler pages dev dist
curl.exe -I http://localhost:8788/
curl.exe -i -H "Accept: text/markdown" http://localhost:8788/
```

Abrir o HTML diretamente ou usar `python -m http.server` permite conferir o visual, mas não executa o Worker nem a negociação HTTP.

## Publicação na Cloudflare Pages

O projeto existente é `360pes-com-br`, conectado ao repositório GitHub `nettooe/360pes.com.br`, com produção na branch `main`. Como a configuração anterior publica os arquivos diretamente, antes do próximo deploy ajuste na integração Git do Pages:

- Comando de build: `npm run build`.
- Diretório de saída: `dist`.
- Framework: nenhum.

Essa configuração deve ser alterada no painel do Pages; adicionar os arquivos ao Git não altera o comando de build configurado no projeto. Mantenha os deploys automáticos existentes. Publique somente `dist/`, evitando servir testes, scripts e documentação como arquivos do site.

O arquivo `_worker.js` usa o modo avançado do Pages e o binding nativo `ASSETS`. `_routes.json` limita sua execução à página inicial e aos arquivos de descoberta; o logotipo continua sendo servido diretamente. As respostas do Worker definem os cabeçalhos HTTP sem depender de `_headers`.

Não é necessário criar um Worker separado na conta: o Pages publica `_worker.js` como uma Pages Function em modo avançado.

## Conteúdo e permissões

- `/` entrega HTML por padrão e Markdown quando `Accept: text/markdown` tiver preferência igual ou maior que HTML e qualidade maior que zero.
- `/index.md` oferece a representação Markdown diretamente. Atualize-a junto com `index.html` ao alterar conteúdo.
- `Vary: Accept` distingue as representações. A página negociada usa `Cache-Control: no-store` para evitar mistura de variantes em caches intermediários.
- O cabeçalho `Link` usa `describedby` e `alternate` para apontar ao Markdown real. Este site não publica API nem catálogo de APIs.
- `robots.txt` e o cabeçalho `Content-Signal` permitem todos os usos declarados: busca, entrada de assistentes e treinamento (`ai-train=yes, search=yes, ai-input=yes`). Ao mudar essa política, mantenha `robots.txt`, `_worker.js` e os grupos de robôs consistentes.
- Todos os grupos de robôs listados têm acesso, incluindo busca, consulta e treinamento. `Claude-Web` é mantido como identificador legado. `Google-Extended` também está permitido.
- Essas diretivas expressam preferências e dependem da cooperação de quem acessa o conteúdo. Regras de AI Crawl Control, WAF e robots.txt gerenciado no painel podem restringir ou alterar o resultado; mantenha-as alinhadas à política dos arquivos.
- O sitemap contém somente o endereço canônico da página. Acrescente páginas públicas quando forem criadas; use `lastmod` apenas com a data real de alteração.

## Validação após publicar

```powershell
curl.exe -i https://360pes.com.br/robots.txt
curl.exe -i https://360pes.com.br/sitemap.xml
curl.exe -I https://360pes.com.br/
curl.exe -i -H "Accept: text/markdown" https://360pes.com.br/
```

Confirme HTTP 200, os tipos de conteúdo e os cabeçalhos `Link`, `Content-Signal` e `Vary`. Para o scanner indicado, envie `POST https://isitagentready.com/api/scan` com `Content-Type: application/json` e corpo `{"url":"https://360pes.com.br"}`. Confira os resultados `robotsTxt`, `sitemap`, `linkHeaders`, `markdownNegotiation`, `contentSignals` e `robotsTxtAiRules`. O scanner de produção só refletirá estas alterações depois da publicação.

Referências: [Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/), [Pages Advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/), [Content Signals](https://contentsignals.org/) e [Sitemaps](https://www.sitemaps.org/protocol.html).

## SEO e etapas na conta do proprietário

O HTML contém título e descrição alinhados ao serviço e à cidade, metadados Open Graph, endereço canônico, descrição do logotipo e JSON-LD com Organization, WebSite, WebPage e Service. Os dados estruturados usam somente contatos, região e serviços presentes na página. Não declare endereço físico, horários, preços ou avaliações sem confirmação. Essa marcação descreve as entidades, mas não garante resultados especiais no Google. Os testes de SEO verificam metadados, referências e correspondência dos serviços.

As etapas abaixo dependem do acesso às contas e devem ser realizadas pelo proprietário:

1. No [painel Cloudflare](https://dash.cloudflare.com/), abra Workers & Pages → `360pes-com-br` → Settings → Build e configure comando `npm run build`, saída `dist` e raiz do repositório vazia. Faça isso antes do próximo push à `main`.
2. Envie os commits para a branch `main` do GitHub. Acompanhe o deploy no Pages e confirme que terminou com sucesso. Confira a página, os contatos, `/robots.txt` e `/sitemap.xml` em produção.
3. Abra o [Google Search Console](https://search.google.com/search-console). Se a propriedade `360pes.com.br` já existir e estiver verificada, use-a. Caso contrário, adicione uma propriedade do tipo Domínio e informe `360pes.com.br`, sem protocolo ou caminho.
4. Para verificar por DNS, copie o valor TXT fornecido pelo Google. Na Cloudflare, selecione o domínio → DNS → Records → Add record. Use tipo TXT, nome `@`, conteúdo exatamente como fornecido pelo Google e TTL automático. Preserve os registros de verificação existentes. Volte ao Search Console e selecione Verificar. Se não reconhecer imediatamente, aguarde a propagação e tente novamente. O código do site não precisa mudar para esse método.
5. Depois de publicar o site, abra Sitemaps no Search Console e envie `https://360pes.com.br/sitemap.xml`. Confira o status de processamento; ter o arquivo publicado não significa que ele já foi enviado nessa conta.
6. Em Inspeção de URL, informe `https://360pes.com.br/`, execute Testar URL publicada e, se estiver disponível para indexação, solicite a indexação. Acompanhe os relatórios de indexação e desempenho; o Google decide quando e se vai indexar a página.
7. Valide a URL no [Schema Markup Validator](https://validator.schema.org/) e no [PageSpeed Insights](https://pagespeed.web.dev/), conferindo celular e computador. O primeiro verifica a marcação Schema.org; os tipos usados não pressupõem elegibilidade para resultados enriquecidos. No Search Console, acompanhe também Core Web Vitals quando houver dados suficientes.

O domínio `www.360pes.com.br`, se utilizado, deve redirecionar permanentemente para `https://360pes.com.br/`, preservando o caminho e os parâmetros. Primeiro confirme seu vínculo e certificado em Custom domains no Pages; depois configure o redirecionamento na Cloudflare. Apenas a tag canônica não cria esse redirecionamento. No painel, confira ainda se regras de WAF/AI Crawl Control permitem o acesso desejado e se não existe `X-Robots-Tag: noindex` aplicado ao domínio de produção.

Instruções oficiais: [configuração do Pages](https://developers.cloudflare.com/pages/configuration/build-configuration/), [verificação de propriedade](https://support.google.com/webmasters/answer/9008080) e [envio de sitemap](https://support.google.com/webmasters/answer/7451001).
