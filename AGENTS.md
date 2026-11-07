# Repository Guidelines

## Estrutura do projeto

Este repositório contém o site estático da 360Pés Podologia, voltado ao atendimento em Botucatu/SP e região. Os arquivos ficam na raiz:

- `index.html`: página principal em português do Brasil e integração com Google Tag Manager.
- `estilos.css`: identidade visual, componentes e adaptação para celular.
- `logotipo.png`: logotipo utilizado na página e como ícone do site.
- `robots.txt`: instruções de rastreamento e referência ao sitemap.
- `sitemap.xml`: endereços públicos para indexação.
- `index.md`: representação da página para agentes; mantenha-a sincronizada com o HTML.
- `_worker.js` e `_routes.json`: negociação HTTP e rotas do Cloudflare Pages.
- `scripts/` e `tests/`: preparação da publicação e testes automatizados.

`dist/` contém a saída gerada e não deve ser versionado. Consulte `README.md` para publicar.

## Execução e desenvolvimento

Use Node.js 22 ou superior, sem dependências de execução:

```powershell
npm test
npm run build
npx wrangler pages dev dist
```

Os comandos executam os testes, geram `dist/` e iniciam a prévia Cloudflare. Abrir `index.html` permite conferir o visual, mas não a negociação HTTP. Use `git diff --check` antes de entregar alterações.

## Estilo e nomenclatura

Use quatro espaços para indentar HTML e CSS, seguindo o padrão predominante de `index.html`. Preserve a codificação UTF-8, os acentos e o atributo `lang="pt-BR"`. Mantenha nomes descritivos em português para seletores, como `faixa_servicos`, e nomes de arquivos em minúsculas. Prefira HTML semântico e forneça texto alternativo para imagens. Não há formatador ou ferramenta de lint configurados; evite reformatações extensas sem relação com a alteração.

## Verificação das alterações

Use o executor nativo `node:test`, com arquivos `tests/*.test.mjs`. Não há meta de cobertura definida. Teste negociação HTTP e políticas ao modificar o Worker. Para mudanças visuais, confira celular e computador, incluindo legibilidade, serviços, logotipo e rolagem horizontal. Valide WhatsApp e e-mail. Ao modificar URLs públicas, revise o endereço canônico, `robots.txt` e `sitemap.xml`. Mantenha os sinais de conteúdo do Worker e do robots consistentes.

## Commits e pull requests

O histórico contém apenas `primeiro commit`, portanto não estabelece uma convenção detalhada. Escreva mensagens curtas e descritivas em português, por exemplo: `Corrige link de contato`. Mantenha cada commit focado em uma mudança.

Na pull request, descreva o objetivo, os arquivos afetados e as verificações realizadas. Vincule a issue quando existir e inclua capturas de tela em celular e computador para alterações visuais.
