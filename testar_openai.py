"""
Script de diagnóstico para testar a conexão com a API da OpenAI
"""
import os
import sys
# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

print("=" * 60)
print("TESTE DE CONEXÃO COM API DA OPENAI")
print("=" * 60)
print()

# Verificar se a chave existe
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("❌ ERRO: OPENAI_API_KEY não encontrada no arquivo .env")
    print()
    print("Solução:")
    print("1. Abra o arquivo .env na raiz do projeto")
    print("2. Adicione a linha: OPENAI_API_KEY=sk-sua_chave_aqui")
    print("3. Salve o arquivo e execute este script novamente")
    sys.exit(1)

print(f"✅ Chave encontrada: {api_key[:7]}...{api_key[-4:]}")
print()

# Verificar formato da chave
if not api_key.startswith("sk-"):
    print("❌ AVISO: A chave não começa com 'sk-'")
    print("   Isso pode indicar que você está usando uma chave do Google ao invés da OpenAI")
    print()
    if api_key.startswith("AIzaSy"):
        print("   Você está usando uma chave do Google (AIzaSy...)!")
        print("   A chave da OpenAI começa com 'sk-'")
        print()
        print("   Para obter a chave correta:")
        print("   1. Acesse: https://platform.openai.com/api-keys")
        print("   2. Faça login com sua conta OpenAI")
        print("   3. Clique em 'Create new secret key'")
        print("   4. Copie a chave (ela começa com 'sk-')")
        print("   5. Cole no arquivo .env")
        sys.exit(1)

# Testar conexão com a API
print("Testando conexão com a API da OpenAI...")
print()

try:
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key)
    
    # Tentar fazer uma requisição simples
    print("Enviando requisição de teste...")
    
    response = client.models.list()
    
    print("✅ Conexão bem-sucedida!")
    print()
    print("Modelos disponíveis (primeiros 5):")
    for i, model in enumerate(list(response.data)[:5]):
        print(f"  - {model.id}")
    print()
    
    # Testar se o GPT-4o está disponível
    model_ids = [model.id for model in response.data]
    if "gpt-4o" in str(model_ids):
        print("✅ GPT-4o está disponível na sua conta!")
    else:
        print("⚠️  AVISO: GPT-4o pode não estar disponível")
        print("   Verifique se sua conta tem acesso ao modelo")
    print()
    
except Exception as e:
    error_str = str(e)
    error_type = type(e).__name__
    
    print(f"❌ ERRO ao conectar com a API: {error_type}")
    print(f"   Mensagem: {error_str}")
    print()
    
    # Diagnóstico específico
    if "401" in error_str or "invalid_api_key" in error_str or "Incorrect API key" in error_str:
        print("🔍 DIAGNÓSTICO: Chave da API inválida")
        print()
        print("Solução:")
        print("1. Verifique se a chave no arquivo .env está correta")
        print("2. Certifique-se de que a chave começa com 'sk-'")
        print("3. Obtenha uma nova chave em: https://platform.openai.com/api-keys")
        print("4. Certifique-se de que copiou a chave completa (sem espaços)")
        
    elif "403" in error_str or "Forbidden" in error_str or "AxiosError" in error_str:
        print("🔍 DIAGNÓSTICO: Permissão negada (403)")
        print()
        print("Possíveis causas:")
        print("1. ❌ Conta sem créditos")
        print("   - Acesse: https://platform.openai.com/account/billing")
        print("   - Verifique seu saldo e adicione créditos se necessário")
        print()
        print("2. ❌ Limite de uso excedido")
        print("   - Acesse: https://platform.openai.com/account/limits")
        print("   - Verifique seus limites diários/mensais")
        print()
        print("3. ❌ Método de pagamento não configurado")
        print("   - Se você é novo na OpenAI, pode precisar adicionar um método de pagamento")
        print("   - Acesse: https://platform.openai.com/account/billing/payment-methods")
        print()
        print("4. ❌ Conta suspensa")
        print("   - Verifique se há alguma notificação na sua conta OpenAI")
        print()
        print("5. ❌ Chave sem permissões")
        print("   - A chave pode não ter acesso ao GPT-4o")
        print("   - Tente criar uma nova chave em: https://platform.openai.com/api-keys")
        
    elif "429" in error_str or "rate_limit" in error_str.lower():
        print("🔍 DIAGNÓSTICO: Limite de taxa excedido (429)")
        print()
        print("Solução:")
        print("1. Aguarde alguns minutos e tente novamente")
        print("2. Verifique seus limites em: https://platform.openai.com/account/limits")
        print("3. Considere fazer upgrade do plano se precisar de mais requisições")
        
    else:
        print("🔍 DIAGNÓSTICO: Erro desconhecido")
        print()
        print("Tente:")
        print("1. Verificar sua conexão com a internet")
        print("2. Verificar se o serviço da OpenAI está online")
        print("3. Verificar se há atualizações nas bibliotecas:")
        print("   pip install --upgrade openai")
    
    sys.exit(1)

print("=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)
print()
print("Se todos os testes passaram, sua configuração está correta!")
print("Se houver erros, siga as instruções acima para corrigir.")
