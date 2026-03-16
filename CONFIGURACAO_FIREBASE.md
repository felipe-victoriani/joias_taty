# 🔧 CONFIGURAÇÃO DAS REGRAS DO FIREBASE

## Problema

Os produtos adicionados/removidos no painel admin não aparecem no catálogo principal porque as **regras de segurança do Firebase** estão bloqueando o acesso.

## Solução - Configurar Regras do Firebase

### Passo 1: Acessar o Console do Firebase

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto: **cachinhos-dourados**

### Passo 2: Configurar Regras do Realtime Database

1. No menu lateral, clique em **"Realtime Database"**
2. Clique na aba **"Regras"** (Rules)
3. Substitua as regras atuais por:

```json
{
  "rules": {
    "produtos": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

4. Clique em **"Publicar"** (Publish)

### O que essas regras fazem:

- ✅ **`.read: true`** - Permite que QUALQUER PESSOA leia os produtos (necessário para o catálogo público)
- ✅ **`.write: "auth != null"`** - Apenas usuários autenticados podem adicionar/editar/excluir produtos (segurança do admin)

### Passo 3: Testar

1. Abra o **painel admin** (admin.html) e faça login
2. Adicione ou remova um produto
3. Abra a **página principal** (index.html)
4. Os produtos devem aparecer automaticamente sem precisar recarregar a página!

## 🔍 Como verificar se está funcionando

### Abra o Console do Navegador (F12) e veja:

- ✅ `"✅ Firebase SDK carregado com sucesso"`
- ✅ `"✅ Conectado ao Firebase Realtime Database"`
- ✅ `"✅ Produtos carregados: X"`
- ✅ `"🔄 Produtos atualizados em tempo real: X"`

### Se aparecer erro:

- ❌ `"PERMISSION_DENIED"` - As regras ainda não foram configuradas corretamente
- ❌ `"❌ Desconectado do Firebase"` - Problema de conexão com internet

## 📱 Recursos Configurados

✅ **Sincronização em tempo real** - Produtos são atualizados automaticamente
✅ **Fallback inteligente** - Se Firebase falhar, usa produtos locais
✅ **Carrinho persistente** - Salvo no localStorage do navegador
✅ **WhatsApp integrado** - Número (67) 99642-5943 configurado

---

**Arquivo de regras já criado**: `FIREBASE_RULES.json` (copie e cole no console do Firebase)
