# Como editar o “Você lembra?”

Este jogo é separado da linha do tempo. Ele não usa content/timeline.json nem as fotos de content/memories.

## 1. Escreva a primeira pergunta

Abra content/voce-lembra.json. Ele começa vazio:

```json
{
  "questions": []
}
```

Copie o modelo de content/voce-lembra.exemplo.json para esse arquivo e troque os textos pelos seus. O arquivo de exemplo não aparece no site.

- id: nome único, com letras minúsculas, números e hífens, sem espaços ou acentos. Exemplo: nova-lembranca.
- question: a pergunta que ela responde. Pode ser sobre lugares, conversas, datas ou qualquer lembrança.
- options: entre duas e seis alternativas diferentes, cada uma entre aspas.
- answer: copie exatamente uma das alternativas. Essa será a resposta correta.
- title: título mostrado depois de acertar ou de clicar em “Revelar lembrança”.
- text: relato mostrado junto às fotos. Para quebrar linha, use \n dentro do texto.

## 2. Adicione as fotos

Se o id for nova-lembranca, crie a pasta:

content/voce-lembra/nova-lembranca/

Coloque nela fotos como 01.jpg, 02.jpg ou 03.gif. JPG, JPEG, PNG, WEBP e GIF são aceitos. Os arquivos entram automaticamente no carrossel, em ordem numérica; não precisa listar fotos no JSON. As fotos devem ficar diretamente na pasta do id.

Cada pergunta tem seu próprio id e sua própria pasta de fotos. A pergunta funciona sem fotos também.

## 3. Adicione mais perguntas

Duplique o objeto entre { e } dentro de questions, separando os objetos com uma vírgula. Use outro id. Não deixe vírgula depois do último objeto.

A ordem dos objetos será a ordem do jogo. Datas não são obrigatórias.

## 4. Confira e publique

Salve o arquivo e confira o site local. npm run check:content aponta problemas como respostas inexistentes, ids repetidos ou alternativas duplicadas.

Depois envie o JSON e as novas fotos em um commit para a branch main do repositório. A Vercel publicará a atualização automaticamente.

Para esvaziar o jogo de novo, volte a usar {"questions":[]}. A seção fica sem perguntas até você adicionar seu conteúdo.