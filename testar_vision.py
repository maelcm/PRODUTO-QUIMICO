"""
Script de teste específico para GPT-4o Vision
"""
import os
import sys
import base64
from dotenv import load_dotenv

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

print("=" * 60)
print("TESTE GPT-4O VISION API")
print("=" * 60)
print()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("ERRO: OPENAI_API_KEY nao encontrada")
    sys.exit(1)

try:
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key)
    
    print("Criando uma imagem de teste simples...")
    # Criar uma imagem simples em base64 (um quadrado pequeno PNG)
    # Imagem PNG 1x1 pixel branco em base64
    test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    print("Enviando requisicao para GPT-4o Vision...")
    print("(Isso pode levar alguns segundos...)")
    print()
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Descreva esta imagem em uma palavra."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{test_image_base64}"
                        }
                    }
                ]
            }
        ],
        max_tokens=50
    )
    
    print("SUCESSO! Resposta recebida:")
    print(f"  {response.choices[0].message.content}")
    print()
    print("O GPT-4o Vision esta funcionando corretamente!")
    print()
    
except Exception as e:
    error_str = str(e)
    error_type = type(e).__name__
    
    print(f"ERRO: {error_type}")
    print(f"Mensagem: {error_str}")
    print()
    
    if "403" in error_str or "Forbidden" in error_str or "AxiosError" in error_str:
        print("=" * 60)
        print("ERRO 403 DETECTADO - DIAGNOSTICO")
        print("=" * 60)
        print()
        print("O erro 403 indica que sua conta nao tem permissoes")
        print("para usar o GPT-4o Vision ou nao tem creditos suficientes.")
        print()
        print("SOLUCOES:")
        print()
        print("1. VERIFICAR CREDITOS:")
        print("   - Acesse: https://platform.openai.com/account/billing")
        print("   - Verifique se voce tem creditos disponiveis")
        print("   - Se nao tiver, adicione creditos a sua conta")
        print()
        print("2. VERIFICAR METODO DE PAGAMENTO:")
        print("   - Acesse: https://platform.openai.com/account/billing/payment-methods")
        print("   - Certifique-se de ter um metodo de pagamento valido")
        print("   - Contas novas podem precisar adicionar um metodo primeiro")
        print()
        print("3. VERIFICAR LIMITES:")
        print("   - Acesse: https://platform.openai.com/account/limits")
        print("   - Verifique se voce tem limites disponiveis")
        print("   - Verifique se nao excedeu o limite diario/mensal")
        print()
        print("4. VERIFICAR STATUS DA CONTA:")
        print("   - Acesse: https://platform.openai.com/account")
        print("   - Verifique se ha alguma notificacao ou problema")
        print("   - Verifique se a conta nao foi suspensa")
        print()
        print("5. VERIFICAR PLANO:")
        print("   - O GPT-4o Vision pode exigir um plano especifico")
        print("   - Verifique se seu plano permite uso do Vision")
        print()
        print("6. TESTAR COM OUTRA CHAVE:")
        print("   - Tente criar uma nova chave API")
        print("   - Acesse: https://platform.openai.com/api-keys")
        print("   - Crie uma nova chave e teste novamente")
        print()
        
    elif "401" in error_str or "invalid_api_key" in error_str:
        print("ERRO: Chave da API invalida")
        print("Verifique se a chave no arquivo .env esta correta")
        
    elif "429" in error_str or "rate_limit" in error_str.lower():
        print("ERRO: Limite de taxa excedido")
        print("Aguarde alguns minutos e tente novamente")
        
    else:
        print("ERRO DESCONHECIDO")
        print(f"Tipo: {error_type}")
        print(f"Detalhes: {error_str}")
    
    sys.exit(1)

print("=" * 60)
print("TESTE CONCLUIDO")
print("=" * 60)
