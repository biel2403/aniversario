# Máquina do Tempo — Gabriel & Júlia

Uma experiência em React, Vite e Framer Motion, com fotografia, capítulos narrativos, contagem do relacionamento, contagem regressiva do casamento e Spotify opcional. Paleta verde oliva; títulos em Fraunces e textos em DM Sans.

**O projeto contém placeholders identificados, não histórias inventadas.** A data do casamento é 24/07/2027. Preencha a data de início do relacionamento, as memórias, as músicas e a mensagem final quando quiser. As pastas de fotografias começam vazias.

## 1. Instalar e iniciar

Instale o Node.js 22.12 ou posterior (Node 24 também funciona). Dentro desta pasta:

```sh
npm install
npm run dev
```

Abra **http://127.0.0.1:5173**. Use esse endereço também para testar o Spotify; `localhost` não é aceito pelo Spotify como Redirect URI. Sem variáveis de ambiente, toda a experiência funciona e o botão Spotify explica que a conexão ainda não foi configurada.

```sh
npm test          # regras de conteúdo, datas e autenticação
npm run build    # valida conteúdo e gera dist/
npm run preview  # confere a versão de produção em http://127.0.0.1:4173
```

## 2. Conteúdo separado do código

```text
content/
├── memories/
│   ├── primeiro-encontro/
│   ├── primeira-viagem/
│   └── pedido/
├── music/
├── videos/
└── timeline.json
```

Edite apenas `content/timeline.json` para títulos, textos, datas e músicas. As pastas `music/` e `videos/` ficam reservadas; arquivos locais nelas não são reproduzidos automaticamente nesta versão.

No objeto `project`:

- `title` e `subtitle`: título do projeto e nomes.
- `relationshipStart`: início do relacionamento em `AAAA-MM-DD`. `null` mostra o placeholder sem inventar uma data.
- `weddingDate`: data do casamento em `AAAA-MM-DD`.
- `finalMessage`: sua mensagem pessoal para Júlia. Pode usar `\n\n` para separar parágrafos.

## 3. Adicionar uma memória — três passos

1. Crie a pasta `content/memories/nova-memoria/`.
2. Coloque as fotografias nela: `01.jpg`, `02.jpg`, `03.webp`…
3. Adicione uma entrada no array `memories` de `content/timeline.json`.

Exemplo completo **de preenchimento**, sem dados pessoais inventados:

```json
{
  "id": "nova-memoria",
  "date": null,
  "title": "[Título da sua lembrança]",
  "text": "[Escreva a história real deste momento.]",
  "songs": []
}
```

Substitua `null` pela data real entre aspas, por exemplo no formato `"AAAA-MM-DD"` (use números reais, não esse texto). O `id` deve usar letras minúsculas, números e hífens, sem espaços ou acentos, e ser igual ao nome da pasta. `songs` pode ficar vazio ou ser omitido. `location` é opcional. Não adicione `photos` ao JSON.

As memórias com data aparecem em ordem cronológica. As entradas sem data aparecem depois, na ordem do arquivo. Para separar parágrafos do texto, escreva `\n\n` dentro da string JSON.

## 4. Adicionar fotografias

Aceita **JPG, JPEG, PNG, WEBP e GIF**, inclusive extensões em maiúsculas. GIFs animados são preservados e animam tanto no carrossel quanto na visualização ampliada. Você pode misturar fotos e GIFs na mesma memória, como `01.jpg`, `02.gif`, `03.webp`. Apenas arquivos diretamente dentro da pasta da memória são considerados. Os nomes são ordenados numericamente: `01`, `02`, `03`, `10`.

O Vite descobre automaticamente as fotografias com `import.meta.glob`. Não existe lista manual de fotos. O nome da pasta precisa ser exatamente o `id` da memória: por exemplo, `pedido-de-casamento` no conteúdo usa `content/memories/pedido-de-casamento/`. Adicionar uma foto durante o desenvolvimento atualiza o projeto; no Windows, a prévia aguarda o arquivo terminar de ser copiado e verifica mudanças periodicamente para evitar erros de arquivo bloqueado. Espere alguns segundos; se o navegador não atualizar, reinicie o servidor. **Depois de publicar, é necessário fazer um novo deploy** para incluir arquivos novos: a descoberta acontece no desenvolvimento/build, não no servidor da Vercel em runtime.

Cada memória mostra suas fotografias em um **carrossel no estilo Instagram**, uma por vez. Coloque quantas fotos quiser na pasta da memória, como `01.jpg`, `02.jpg`, `03.jpg`: elas entram automaticamente nessa ordem, sem alterar o JSON. No celular, deslize para os lados. No computador, arraste com o mouse, use as setas laterais ou os indicadores abaixo. Com o carrossel em foco, as setas do teclado também navegam; Home/End levam à primeira/última foto. O contador mostra a posição atual. As imagens mantêm o enquadramento completo, inclusive fotos horizontais e verticais misturadas.

As fotos usam carregamento preguiçoso e decodificação assíncrona. As URLs entram no código, mas os bytes das imagens só são baixados quando o navegador precisar delas. Uma memória sem fotos continua disponível; uma imagem que falhar apresenta um fallback e as próximas continuam acessíveis. Clique para ampliar; na ampliação, use as setas do teclado, os botões ou deslize no celular. Escape fecha. O carrossel não avança automaticamente, e sua navegação não altera a música.

Para manter o celular rápido, prefira WebP/JPEG, aproximadamente 1600–2200 pixels no maior lado, sem arquivos enormes. Esta versão preserva seus originais e **não comprime automaticamente**. Evite fotos de dezenas de megabytes. Antes de publicar imagens pessoais, retire os metadados de localização se não quiser expô-los.

## 5. Adicionar músicas do Spotify

Cada memória aceita **até três URIs de faixas**, sem cadastrar título, artista ou capa. No Spotify, copie o link da música. O trecho depois de `/track/` e antes de `?` é o identificador de 22 caracteres. Converta assim:

```text
Link: https://open.spotify.com/track/IDENTIFICADOR_DA_FAIXA
URI:  spotify:track:IDENTIFICADOR_DA_FAIXA
```

`IDENTIFICADOR_DA_FAIXA` é uma instrução de preenchimento, não um valor válido para copiar. Adicione os URIs reais ao array `songs`:

```text
"songs": ["URI_REAL_DA_PRIMEIRA_FAIXA", "URI_REAL_DA_SEGUNDA_FAIXA"]
```

A aplicação consulta nome, artistas, álbum, capa e duração pela API. Enquanto estiver desconectada, mostra apenas posições neutras (“Música 1”), sem inventar metadados nem expor URIs. Ao selecionar uma faixa, ela é reproduzida no player persistente. Anterior/próxima percorrem a pequena playlist escolhida. Abrir outra memória ou rolar a página **não troca a música**. Não existe sincronização entre Spotify e fotos, animações ou vídeos.

## 6. Configurar o Spotify

1. Abra o [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) e crie um aplicativo com Web API e Web Playback SDK.
2. Copie apenas o **Client ID**. Este projeto usa **Authorization Code com PKCE**, inteiramente no navegador. Não exige backend ou Client Secret.
3. Cadastre o Redirect URI exato: `http://127.0.0.1:5173/callback`.
4. No painel de usuários do app, autorize as contas que vão usá-lo, incluindo Júlia.
5. Copie `.env.example` para `.env.local` e preencha:

```dotenv
VITE_SPOTIFY_CLIENT_ID=seu_client_id_publico
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

6. Reinicie `npm run dev`, abra o endereço acima e conecte pelo botão do site.

Para testar com `npm run preview`, cadastre também `http://127.0.0.1:4173/callback`, altere o Redirect URI e faça um novo build. As variáveis `VITE_` ficam incorporadas ao frontend durante o build; Client ID é público. **Nunca coloque Client Secret, senha ou qualquer segredo nessas variáveis.**

Conforme a [documentação do modo de desenvolvimento](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), o proprietário precisa de Premium e novos apps nesse modo permitem até cinco usuários autorizados. Usuários fora da lista podem conseguir autenticar, mas receber erro 403 na API. A [reprodução pelo Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk) também exige Premium. Verifique as regras do seu app no Dashboard, pois o Spotify pode alterá-las.

Permissões para ouvir: `streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state` e `user-modify-playback-state`. Ao conectar pela página **Playlist**, também são solicitadas `playlist-modify-public` e `playlist-modify-private`. Contas já conectadas precisam usar **Autorizar salvamento** para conceder esse acesso adicional.

### Salvar a trilha no perfil dela

1. Júlia conecta a própria conta e toca uma música em uma memória.
2. Abre **Playlist** no menu ou **Salvar esta playlist** no player expandido. A página `/playlist` mostra todas as músicas da pequena playlist em reprodução, na mesma ordem.
3. Escolhe o nome e mantém **Exibir no meu perfil** marcado para criar uma playlist pública. Desmarcado, ela fica privada na biblioteca.
4. Se necessário, autoriza o acesso no Spotify e retorna à mesma página, com a seleção e o nome preservados nesta aba.
5. Confirma em **Salvar no meu Spotify** e recebe o link da playlist criada na conta conectada.

Visitar a página ou autorizar o acesso não cria nada. A criação acontece apenas no botão de salvamento, usando [`POST /me/playlists`](https://developer.spotify.com/documentation/web-api/reference/create-playlist) e [`PUT /playlists/{id}/items`](https://developer.spotify.com/documentation/web-api/reference/reorder-or-replace-playlists-items). Não modifica playlists anteriores. Se o preenchimento falhar após a criação, uma nova tentativa conclui a mesma playlist, sem duplicar faixas. Salvamentos idênticos nesta sessão reutilizam o resultado; desconectar limpa a seleção e os registros locais. Se a rede falhar sem confirmar a criação, confira a biblioteca antes de tentar novamente.

Tokens e verificador PKCE ficam no `sessionStorage` da aba, não no JSON, no repositório ou em logs. O retorno OAuth valida um `state` aleatório e expira após dez minutos. O código de autorização é removido da URL. O access token é renovado automaticamente; solicitações paralelas compartilham a renovação. Desconectar limpa a sessão e encerra o dispositivo do player. A sessão não é sincronizada entre abas.

### Se algo não tocar

- Sem Premium: os capítulos funcionam e há links para abrir as faixas no Spotify.
- Erro 403: confira Premium e os usuários permitidos no app.
- Sessão expirada/recusada: conecte novamente.
- Limite da API: aguarde a pausa indicada pelo Spotify antes de tentar de novo.
- Safari/iPhone ou autoplay bloqueado: toque em reproduzir; a ativação do player parte do clique. Alguns navegadores restringem volume ou reprodução em segundo plano.
- Bloqueador de conteúdo/SDK indisponível: tente outro navegador ou continue sem Spotify.
- Faixa indisponível na sua região: escolha outra.

Todos esses estados preservam a experiência visual. A API/SDK reais precisam ser verificados com um Client ID configurado e uma conta autorizada; testes automáticos usam respostas simuladas e não substituem essa verificação.

Referências: [PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [Redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [SDK](https://developer.spotify.com/documentation/web-playback-sdk/reference).

## 7. Publicar na Vercel

1. Coloque o projeto em um repositório Git de sua escolha, incluindo `content/` e `package-lock.json`. **Não inclua `.env.local`.**
2. Importe esse repositório na Vercel e escolha o preset **Vite**.
3. Build: `npm run build`. Pasta de saída: `dist`.
4. Cadastre `VITE_SPOTIFY_CLIENT_ID` e `VITE_SPOTIFY_REDIRECT_URI` nas variáveis do projeto da Vercel.
5. Use o domínio estável da publicação: `https://SEU-DOMINIO/callback`. Cadastre exatamente a mesma URL no Spotify Dashboard. O domínio deve coincidir com aquele que você abre no navegador.
6. Faça o deploy. `vercel.json` já direciona `/callback` e `/playlist` para a aplicação.
7. Teste a navegação sem Spotify, depois o login com uma conta autorizada, reprodução, pausa e reconexão.

Previews com domínios temporários da Vercel devem ter um Redirect URI correspondente; preferir um domínio estável simplifica o OAuth. Alterar variáveis exige um novo deploy/build. Este projeto está preparado para publicação; nenhuma conta Vercel é vinculada automaticamente.

## 8. Organização

```text
src/
├── components/  # fotos, modais, mini-playlists e player
├── sections/    # abertura, memórias, presente, futuro e final
├── hooks/       # sessão e ciclo de vida do player Spotify
├── services/    # OAuth PKCE, Web API e Web Playback SDK
├── utils/       # conteúdo, ordenação e cálculos de datas
├── data/        # leitura do JSON e descoberta das fotografias
├── styles/      # sistema visual e layouts responsivos
├── App.jsx
└── main.jsx
```

As regras de conteúdo são independentes dos componentes, permitindo um futuro editor sem refazer a apresentação. A validação roda antes de cada build e aponta ids repetidos, datas inválidas e URIs malformados. Datas ausentes usam `null`, não datas fictícias.

O contador de relacionamento usa o calendário de **America/Sao_Paulo**, considerando anos bissextos e finais de mês. O countdown vira na **meia-noite de 24/07/2027 em São Paulo**; como o horário da cerimônia não foi informado, não presume outro horário. No dia, mostra “É hoje”; depois, “Um novo capítulo começou”.

As animações respeitam `prefers-reduced-motion`. Modais têm foco contido, fechamento por Escape e retorno ao botão de origem. Imagens têm texto alternativo; controles têm nomes acessíveis. As fontes externas têm fallback local em Georgia e Arial. Não há analytics, backend ou banco de dados.

### Carta, jogo de lembranças e playlist completa

- A carta fica no encerramento. Toque no envelope para abrir; os parágrafos aparecem aos poucos. Edite `project.finalMessage` em `content/timeline.json`; separe os parágrafos com `\n\n`. O texto foi deixado como `...` a pedido do Gabriel.
- “Você lembra?” usa conteúdo independente em `content/voce-lembra.json` e fotos em `content/voce-lembra/ID/`. Está vazio, pronto para receber outras lembranças. Copie o modelo de `content/voce-lembra.exemplo.json` e siga `content/voce-lembra/COMO-EDITAR.md`. Ao acertar ou escolher “Revelar lembrança”, mostra as fotos e o relato da pergunta.
- Na página Playlist, “Este momento” salva a memória selecionada e “A história inteira” reúne todas as músicas, na ordem da linha do tempo, sem faixas repetidas. O botão do encerramento abre a playlist completa. A escolha fica guardada durante a autorização do Spotify.
- Playlists maiores são enviadas em lotes de até 100 faixas. Se o envio parar depois de criar, a nova tentativa usa a mesma playlist e recomeça o preenchimento para evitar duplicações.