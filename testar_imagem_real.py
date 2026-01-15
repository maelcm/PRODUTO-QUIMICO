"""
Script para testar uma imagem real do usuário e diagnosticar erro 403
"""
import os
import sys
from dotenv import load_dotenv

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

print("=" * 60)
print("TESTE COM IMAGEM REAL - DIAGNOSTICO ERRO 403")
print("=" * 60)
print()

# Verificar se a imagem existe
image_path = "IMG_20260108_095920.jpg"
if not os.path.exists(image_path):
    print(f"ERRO: Arquivo {image_path} nao encontrado!")
    print()
    print("Por favor, coloque a imagem na mesma pasta deste script")
    print("ou informe o caminho completo da imagem.")
    sys.exit(1)

print(f"Imagem encontrada: {image_path}")
file_size = os.path.getsize(image_path)
print(f"Tamanho do arquivo: {file_size / (1024*1024):.2f} MB")
print()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("ERRO: OPENAI_API_KEY nao encontrada")
    sys.exit(1)

print(f"Chave API: {api_key[:10]}...{api_key[-4:]}")
print()

# Importar serviços
try:
    from services.vision_service import VisionService
    print("Importando VisionService...")
    vision = VisionService()
    print("VisionService inicializado com sucesso!")
    print()
except Exception as e:
    print(f"ERRO ao inicializar VisionService: {e}")
    sys.exit(1)

# Ler imagem
print("Lendo imagem...")
try:
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    print(f"Imagem lida: {len(image_bytes)} bytes")
    print()
except Exception as e:
    print(f"ERRO ao ler imagem: {e}")
    sys.exit(1)

# Tentar processar
print("Processando imagem com GPT-4o Vision...")
print("(Isso pode levar alguns segundos...)")
print()
print("-" * 60)

try:
    resultado = vision.extract_inventory_from_image(image_bytes)
    print()
    print("=" * 60)
    print("SUCESSO!")
    print("=" * 60)
    print()
    print(f"Produtos encontrados: {len(resultado)}")
    print()
    for i, item in enumerate(resultado, 1):
        print(f"{i}. {item.get('produto', 'N/A')}: {item.get('quantidade', 'N/A')} {item.get('unidade', 'N/A')}")
    
except Exception as e:
    error_str = str(e)
    error_type = type(e).__name__
    
    print()
    print("=" * 60)
    print("ERRO DETECTADO")
    print("=" * 60)
    print()
    print(f"Tipo: {error_type}")
    print(f"Mensagem: {error_str}")
    print()
    
    if "403" in error_str or "Forbidden" in error_str or "AxiosError" in error_str:
        print("=" * 60)
        print("DIAGNOSTICO: ERRO 403 (Permissao Negada)")
        print("=" * 60)
        print()
        print("Este erro geralmente indica um dos seguintes problemas:")
        print()
        print("1. CONTA SEM CREDITOS:")
        print("   - Acesse: https://platform.openai.com/account/billing")
        print("   - Verifique seu saldo de creditos")
        print("   - Se necessario, adicione creditos a sua conta")
        print()
        print("2. METODO DE PAGAMENTO NAO CONFIGURADO:")
        print("   - Acesse: https://platform.openai.com/account/billing/payment-methods")
        print("   - Adicione um metodo de pagamento valido")
        print("   - Contas novas precisam configurar pagamento antes de usar")
        print()
        print("3. LIMITE DE USO EXCEDIDO:")
        print("   - Acesse: https://platform.openai.com/account/limits")
        print("   - Verifique limites diarios/mensais")
        print("   - Verifique rate limits (requisicoes por minuto)")
        print()
        print("4. MODELO NAO DISPONIVEL:")
        print("   - O GPT-4o pode nao estar disponivel para sua conta")
        print("   - Verifique em: https://platform.openai.com/account/limits")
        print("   - Algumas contas precisam fazer upgrade do plano")
        print()
        print("5. CONTA SUSPENSA OU COM PROBLEMAS:")
        print("   - Acesse: https://platform.openai.com/account")
        print("   - Verifique se ha notificacoes ou problemas")
        print("   - Entre em contato com suporte se necessario")
        print()
        print("=" * 60)
        print("ACOES RECOMENDADAS:")
        print("=" * 60)
        print()
        print("1. Verifique seu saldo e adicione creditos se necessario")
        print("2. Configure metodo de pagamento se ainda nao configurou")
        print("3. Verifique se nao excedeu limites de uso")
        print("4. Aguarde alguns minutos se for limite de taxa (rate limit)")
        print("5. Tente novamente apos corrigir os problemas acima")
        print()
    else:
        print("Outro tipo de erro detectado.")
        print("Verifique a mensagem acima para mais detalhes.")

print()
print("=" * 60)
