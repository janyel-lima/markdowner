# Markdowner — Setup Firebase + GitHub Pages

## O que você vai precisar

- Conta Google (para o Firebase)
- Repositório no GitHub com GitHub Pages ativado

---

## Passo 1 — Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto**
3. Dê um nome (ex: `markdowner-collab`) e finalize a criação
4. No menu lateral, clique em **Realtime Database**
5. Clique em **Criar banco de dados**
6. Escolha o servidor mais próximo (geralmente `us-central1`) e clique em **Avançar**
7. Selecione **Iniciar no modo de teste** → **Ativar**

> ⚠️ O modo de teste expira em 30 dias. Antes de expirar, ajuste as regras (passo abaixo).

---

## Passo 2 — Pegar as credenciais

1. No painel do Firebase, clique em ⚙️ **Configurações do projeto**
2. Role até **Seus aplicativos** → clique no ícone `</>`  (Web)
3. Registre o app (nome qualquer) e **não** ative o hosting
4. Copie os valores do objeto `firebaseConfig`:

```js
apiKey: "AIza...",
databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
projectId: "seu-projeto-id",
```

---

## Passo 3 — Adicionar os secrets no GitHub

1. No seu repositório, vá em **Settings → Secrets and variables → Actions**
2. Clique em **New repository secret** para cada um:

| Nome do secret          | Valor                                                  |
|------------------------|--------------------------------------------------------|
| `FIREBASE_API_KEY`     | `AIza...` (o `apiKey`)                                 |
| `FIREBASE_DB_URL`      | `https://seu-projeto-default-rtdb.firebaseio.com`      |
| `FIREBASE_PROJECT_ID`  | `seu-projeto-id`                                       |

---

## Passo 4 — Ativar o GitHub Pages com Actions

1. No repositório, vá em **Settings → Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Faça um `git push` no branch `main`
4. O workflow em `.github/workflows/deploy.yml` vai rodar automaticamente, injetar as credenciais e publicar o site

---

## Passo 5 — Regras do Realtime Database (após 30 dias)

Após o período de teste, configure as regras para acesso aberto (já que é uma ferramenta interna sem autenticação):

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "doc": {
          ".validate": "newData.isString() && newData.val().length < 500000"
        },
        "chat": {
          "$msgId": {
            ".validate": "newData.hasChildren(['text','userId','userName','userColor','ts'])"
          }
        }
      }
    }
  }
}
```

Cole isso em **Realtime Database → Regras** e publique.

---

## Estrutura no banco

```
rooms/
  {CÓDIGO_6_CHARS}/
    doc:          "# conteúdo markdown..."
    createdAt:    1234567890
    hostId:       "abc123"
    users/
      {userId}/
        name:     "Ana"
        color:    "#e8a020"
        joinedAt: 1234567890
    chat/
      {pushId}/
        text:      "oi!"
        userId:    "abc123"
        userName:  "Ana"
        userColor: "#e8a020"
        ts:        1234567890
```

Os dados de sala são temporários — podem ser limpos manualmente no console do Firebase quando necessário.

---

## Troubleshooting

**"Firebase não configurado"** → Os secrets não foram adicionados ou o workflow não rodou ainda. Verifique em **Actions** se o deploy passou.

**Regras negadas** → O período de teste de 30 dias expirou. Atualize as regras como descrito no Passo 5.

**Código não encontrado** → A sala pode ter sido limpa do banco ou o código foi digitado errado.
