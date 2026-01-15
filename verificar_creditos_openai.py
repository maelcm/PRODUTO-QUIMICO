"""
Script para verificar status da conta OpenAI e créditos
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
print("VERIFICACAO DE CREDITOS E STATUS DA CONTA OPENAI")
print("=" * 70)
print()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("ERRO: OPENAI_API_KEY nao encontrada")
    sys.exit(1)

print("Chave API encontrada: " + api_key[:10] + "..." + api_key[-4:])
print()

# Verificar uso e créditos via API
print("Verificando status da conta...")
print()

try:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    
    # Tentar uma requisição simples para ver se funciona
    print("1. Testando conexao basica...")
    try:
        models = client.models.list()
        print("   [OK] Conexao funcionando")
        print(f"   Modelos disponiveis: {len(list(models.data))}")
    except Exception as e:
        print(f"   [ERRO] Falha na conexao: {e}")
        sys.exit(1)
    
    print()
    print("2. Testando chamada com imagem pequena...")
    print("   (Isso vai consumir alguns creditos se funcionar)")
    print()
    
    # Imagem de teste muito pequena
    import base64
    test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Diga apenas 'TESTE OK'"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{test_image}",
                                "detail": "low"
                            }
                        }
                    ]
                }
            ],
            max_tokens=10
        )
        
        print("   [SUCESSO] Chamada com imagem funcionou!")
        print(f"   Resposta: {response.choices[0].message.content}")
        print()
        print("=" * 70)
        print("DIAGNOSTICO: A API ESTA FUNCIONANDO")
        print("=" * 70)
        print()
        print("Se este teste funcionou mas o upload de imagem grande falha,")
        print("o problema pode ser:")
        print()
        print("1. Imagem muito grande - o sistema ja reduz automaticamente")
        print("2. Rate limit temporario - aguarde alguns minutos")
        print("3. Limite de uso excedido - verifique em:")
        print("   https://platform.openai.com/account/limits")
        print()
        
    except Exception as e:
        error_str = str(e)
        
        print(f"   [ERRO] Falha na chamada: {error_str}")
        print()
        
        if "403" in error_str or "Forbidden" in error_str:
            print("=" * 70)
            print("*** ERRO 403 DETECTADO ***")
            print("=" * 70)
            print()
            print("O erro 403 indica um problema com:")
            print()
            print("1. CREDITOS INSUFICIENTES (MUITO PROVAVEL)")
            print("   - Acesse: https://platform.openai.com/account/billing")
            print("   - Verifique seu saldo")
            print("   - Se necessario, ADICIONE CREDITOS")
            print()
            print("2. RATE LIMIT")
            print("   - Aguarde 5-10 minutos")
            print("   - Tente novamente")
            print()
            print("3. RESTRICOES DA CONTA")
            print("   - Verifique: https://platform.openai.com/account")
            print("   - Procure por notificacoes")
            print()
            print("=" * 70)
            print("SOLUCAO RECOMENDADA:")
            print("=" * 70)
            print()
            print("1. Acesse: https://platform.openai.com/account/billing")
            print("2. Adicione pelo menos $5-10 em creditos")
            print("3. Aguarde alguns minutos para processar")
            print("4. Tente novamente")
            print()
            print("NOTA: O GPT-4o Vision tem custo por imagem.")
            print("Certifique-se de ter creditos suficientes.")
            
except Exception as e:
    print(f"ERRO GERAL: {e}")

print()
print("=" * 70)
