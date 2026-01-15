"""
Diagnóstico completo do erro 403
"""
import os
import sys
from dotenv import load_dotenv

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

print("=" * 70)
print("DIAGNOSTICO COMPLETO - ERRO 403")
print("=" * 70)
print()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("ERRO: OPENAI_API_KEY nao encontrada no .env")
    sys.exit(1)

print(f"1. Chave API encontrada: {api_key[:10]}...{api_key[-4:]}")
print(f"   Formato correto: {'SIM' if api_key.startswith('sk-') else 'NAO'}")
print()

# Testar conexão básica
print("2. Testando conexao basica com a API...")
try:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    
    # Listar modelos
    models = client.models.list()
    print("   [OK] Conexao basica funcionando")
    print(f"   Modelos disponiveis: {len(list(models.data))}")
    
    # Verificar se gpt-4o está disponível
    model_ids = [m.id for m in models.data]
    gpt4o_available = any('gpt-4o' in m for m in model_ids)
    print(f"   GPT-4o disponivel: {'SIM' if gpt4o_available else 'NAO'}")
    
    if not gpt4o_available:
        print("   AVISO: GPT-4o pode nao estar disponivel para sua conta!")
        print("   Modelos encontrados com 'gpt':")
        for m in model_ids:
            if 'gpt' in m.lower():
                print(f"     - {m}")
    
except Exception as e:
    print(f"   [ERRO] Falha na conexao basica: {e}")
    sys.exit(1)

print()

# Testar uso da API com requisição simples (sem imagem)
print("3. Testando chamada de API simples (texto apenas)...")
try:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Diga apenas 'OK'"}],
        max_tokens=10
    )
    print("   [OK] Chamada de texto funcionou")
    print(f"   Resposta: {response.choices[0].message.content}")
except Exception as e:
    error_str = str(e)
    print(f"   [ERRO] Falha na chamada de texto: {error_str}")
    
    if "403" in error_str or "Forbidden" in error_str:
        print()
        print("   *** ERRO 403 DETECTADO EM CHAMADA SIMPLES ***")
        print("   Isso indica que o problema NAO e com a imagem,")
        print("   mas sim com permissoes ou creditos da conta!")
        sys.exit(1)
    elif "401" in error_str or "invalid" in error_str.lower():
        print("   [ERRO] Chave da API invalida ou expirada")
        sys.exit(1)

print()

# Testar com imagem pequena
print("4. Testando chamada com imagem pequena...")
try:
    # Criar uma imagem de teste muito pequena (1x1 pixel)
    import base64
    test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Descreva esta imagem em uma palavra."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{test_image_base64}",
                            "detail": "low"
                        }
                    }
                ]
            }
        ],
        max_tokens=10
    )
    print("   [OK] Chamada com imagem funcionou")
    print(f"   Resposta: {response.choices[0].message.content}")
    
except Exception as e:
    error_str = str(e)
    error_type = type(e).__name__
    
    print(f"   [ERRO] Falha na chamada com imagem")
    print(f"   Tipo: {error_type}")
    print(f"   Mensagem: {error_str}")
    print()
    
    # Análise detalhada do erro
    if "403" in error_str or "Forbidden" in error_str:
        print("   *** ERRO 403 DETECTADO COM IMAGEM ***")
        print()
        print("   DIAGNOSTICO:")
        print()
        
        # Verificar detalhes específicos
        if "insufficient_quota" in error_str.lower() or "quota" in error_str.lower():
            print("   > CAUSA: QUOTA INSUFICIENTE (sem creditos)")
            print("   > SOLUCAO: Adicione creditos em:")
            print("     https://platform.openai.com/account/billing")
            print()
        
        if "rate_limit" in error_str.lower() or "rate limit" in error_str.lower():
            print("   > CAUSA: LIMITE DE TAXA EXCEDIDO")
            print("   > SOLUCAO: Aguarde alguns minutos e tente novamente")
            print()
        
        if "access_denied" in error_str.lower() or "permission" in error_str.lower():
            print("   > CAUSA: ACESSO NEGADO")
            print("   > SOLUCAO: Verifique se sua conta tem acesso ao GPT-4o Vision")
            print("     https://platform.openai.com/account/limits")
            print()
        
        if "model" in error_str.lower() and ("not available" in error_str.lower() or "not found" in error_str.lower()):
            print("   > CAUSA: MODELO NAO DISPONIVEL")
            print("   > SOLUCAO: Verifique se o GPT-4o esta disponivel para sua conta")
            print("     Algumas contas precisam fazer upgrade")
            print()
        
        # Tentar extrair mais informações do erro
        try:
            if hasattr(e, 'response'):
                response_obj = getattr(e, 'response', None)
                if response_obj:
                    print("   Detalhes adicionais do erro:")
                    if hasattr(response_obj, 'json'):
                        error_data = response_obj.json()
                        print(f"     {error_data}")
                    elif hasattr(response_obj, 'text'):
                        print(f"     {response_obj.text}")
        except:
            pass
        
        print()
        print("   PROXIMOS PASSOS:")
        print("   1. Acesse: https://platform.openai.com/account/billing")
        print("      - Verifique saldo de creditos")
        print("      - Adicione metodo de pagamento se necessario")
        print("      - Adicione creditos se estiver sem saldo")
        print()
        print("   2. Acesse: https://platform.openai.com/account/limits")
        print("      - Verifique limites de uso")
        print("      - Verifique rate limits")
        print("      - Verifique se GPT-4o esta disponivel")
        print()
        print("   3. Verifique status da conta:")
        print("      - https://platform.openai.com/account")
        print("      - Procure por notificacoes ou avisos")
        print()
        
        sys.exit(1)

print()
print("=" * 70)
print("DIAGNOSTICO CONCLUIDO")
print("=" * 70)
print()
print("Todos os testes passaram! O problema pode ser especifico")
print("da imagem que voce esta tentando enviar ou do tamanho.")
print()
print("Se ainda houver erro 403 ao fazer upload, provavelmente e:")
print("1. Imagem muito grande (o sistema tenta reduzir automaticamente)")
print("2. Limite de rate limit (aguarde alguns minutos)")
print("3. Creditos muito baixos (adicione creditos)")
