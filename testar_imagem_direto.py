"""
Teste direto com a imagem que está falhando
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
print("TESTE DIRETO COM A IMAGEM REAL")
print("=" * 70)
print()

# Procurar a imagem
image_file = "IMG_20260108_095920.jpg"
if not os.path.exists(image_file):
    # Tentar encontrar na pasta Downloads
    downloads_path = os.path.join(os.path.expanduser("~"), "Downloads", image_file)
    if os.path.exists(downloads_path):
        image_file = downloads_path
        print(f"Imagem encontrada em: {downloads_path}")
    else:
        print(f"ERRO: Arquivo {image_file} nao encontrado!")
        print()
        print("Por favor, coloque a imagem na pasta do projeto ou informe o caminho.")
        sys.exit(1)
else:
    print(f"Imagem encontrada: {image_file}")

# Verificar tamanho
file_size = os.path.getsize(image_file)
print(f"Tamanho original: {file_size / (1024*1024):.2f} MB")
print()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("ERRO: OPENAI_API_KEY nao encontrada")
    sys.exit(1)

# Testar processamento real
print("Processando imagem usando VisionService...")
print()

try:
    from services.vision_service import VisionService
    vision = VisionService()
    
    # Ler imagem
    with open(image_file, "rb") as f:
        image_bytes = f.read()
    
    print(f"Imagem lida: {len(image_bytes)} bytes ({len(image_bytes)/(1024*1024):.2f} MB)")
    print()
    print("Iniciando processamento (isso pode levar alguns segundos)...")
    print()
    
    resultado = vision.extract_inventory_from_image(image_bytes)
    
    print("=" * 70)
    print("SUCESSO!")
    print("=" * 70)
    print()
    print(f"Produtos encontrados: {len(resultado)}")
    print()
    for i, item in enumerate(resultado, 1):
        print(f"{i}. {item.get('produto', 'N/A')}: {item.get('quantidade', 'N/A')} {item.get('unidade', 'N/A')}")
    
except Exception as e:
    error_str = str(e)
    error_type = type(e).__name__
    
    print("=" * 70)
    print("ERRO DETECTADO")
    print("=" * 70)
    print()
    print(f"Tipo: {error_type}")
    print(f"Mensagem completa:")
    print(error_str)
    print()
    
    if "403" in error_str or "Forbidden" in error_str:
        print("=" * 70)
        print("ERRO 403 CONFIRMADO")
        print("=" * 70)
        print()
        print("O erro 403 persiste mesmo apos todas as otimizacoes.")
        print("Isso indica que o problema NAO e com o codigo, mas sim")
        print("com a CONTA OPENAI.")
        print()
        print("POSSIVEIS CAUSAS:")
        print()
        print("1. CREDITOS MUITO BAIXOS OU ZERO")
        print("   - A conta pode ter creditos insuficientes para imagens maiores")
        print("   - Mesmo que funcione com imagens pequenas, imagens grandes")
        print("     podem ser bloqueadas")
        print()
        print("2. RATE LIMIT ESPECIFICO PARA IMAGENS GRANDES")
        print("   - A OpenAI pode ter limites diferentes para imagens grandes")
        print("   - Aguarde 15-30 minutos e tente novamente")
        print()
        print("3. RESTRICOES DA CONTA")
        print("   - Conta nova pode ter restricoes")
        print("   - Alguns modelos podem nao estar disponiveis")
        print()
        print("=" * 70)
        print("SOLUCAO DEFINITIVA:")
        print("=" * 70)
        print()
        print("1. Acesse: https://platform.openai.com/account/billing")
        print("2. Verifique o saldo de creditos")
        print("3. Se estiver baixo (< $5), ADICIONE CREDITOS")
        print("4. Certifique-se de ter um metodo de pagamento configurado")
        print("5. Aguarde alguns minutos apos adicionar creditos")
        print("6. Tente novamente")
        print()
        print("NOTA IMPORTANTE:")
        print("- O GPT-4o Vision custa mais por imagem processada")
        print("- Imagens maiores consomem mais creditos")
        print("- Certifique-se de ter creditos suficientes")
        print()
        print("Se o problema persistir apos adicionar creditos,")
        print("pode ser necessario:")
        print("- Aguardar mais tempo (rate limit)")
        print("- Verificar se ha restricoes na conta")
        print("- Contatar suporte da OpenAI")
        
print()
print("=" * 70)
