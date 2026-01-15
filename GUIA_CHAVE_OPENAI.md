# 🔑 Guia: Como Obter e Configurar a Chave da OpenAI

## ⚠️ Problema Identificado

Você está usando uma **chave do Google** (que começa com `AIzaSy`) no lugar de uma **chave da OpenAI** (que começa com `sk-`).

**São serviços diferentes e não podem ser trocadas!**

## ✅ Solução Passo a Passo

### 1. Obter a Chave da OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI (ou crie uma se não tiver)
3. Clique em "Create new secret key"
4. Dê um nome para a chave (ex: "Smart Inventory System")
5. **Copie a chave imediatamente** - ela só aparece uma vez!
6. A chave deve começar com `sk-` (exemplo: `sk-proj-abc123...`)

### 2. Configurar no Arquivo .env

1. Abra o arquivo `.env` na raiz do projeto
2. Localize a linha: `OPENAI_API_KEY=...`
3. Substitua pelo valor: `OPENAI_API_KEY=sk-sua_chave_aqui`
4. **Importante:** Não adicione espaços ou aspas
5. Salve o arquivo

### 3. Recarregar o Sistema

1. No Streamlit, clique em "🔄 Limpar Cache e Recarregar" na sidebar
2. Ou recarregue a página (F5)
3. O sistema deve funcionar agora!

## 🔍 Como Identificar Chaves Corretas

| Serviço | Formato da Chave | Exemplo |
|---------|------------------|---------|
| **OpenAI** | Começa com `sk-` | `sk-proj-abc123...` |
| **Google** | Começa com `AIzaSy` | `AIzaSyB4...` |

## 💰 Custos da OpenAI

- A OpenAI cobra por uso da API
- GPT-4o Vision tem custo por imagem processada
- Verifique os preços em: https://openai.com/pricing
- Você pode definir limites de uso na sua conta

## ❓ Problemas Comuns

### "Chave inválida" mesmo após configurar
- Verifique se não há espaços extras na chave
- Certifique-se de que a chave começa com `sk-`
- Verifique se a chave não expirou ou foi revogada

### "Sem créditos"
- Você precisa adicionar créditos na sua conta OpenAI
- Acesse: https://platform.openai.com/account/billing

### "Rate limit exceeded"
- Você está fazendo muitas requisições
- Aguarde alguns minutos ou atualize seu plano

## 📞 Suporte

Se continuar com problemas:
1. Execute: `python verificar_config.py` para diagnosticar
2. Verifique se o arquivo `.env` está correto
3. Confirme que a chave foi copiada completamente
