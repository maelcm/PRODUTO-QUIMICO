"""
Script de teste para verificar conversão de imagens
Execute: python test_image_conversion.py <caminho_da_imagem>
"""

import sys
from pathlib import Path
from services.vision_service import VisionService

if len(sys.argv) < 2:
    print("Uso: python test_image_conversion.py <caminho_da_imagem>")
    sys.exit(1)

image_path_str = sys.argv[1]
image_path = Path(image_path_str)

# Se o arquivo não existe, tentar com extensões comuns
if not image_path.exists():
    extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff']
    found = False
    for ext in extensions:
        test_path = Path(str(image_path) + ext)
        if test_path.exists():
            image_path = test_path
            found = True
            print(f"[INFO] Arquivo encontrado com extensao: {ext}")
            break
    
    if not found:
        print(f"Erro: Arquivo nao encontrado: {image_path_str}")
        print("Tentativas:")
        for ext in extensions:
            test_path = Path(str(image_path_str) + ext)
            print(f"  - {test_path} {'[EXISTE]' if test_path.exists() else '[nao existe]'}")
        sys.exit(1)

print("=" * 60)
print("TESTE DE CONVERSAO DE IMAGEM")
print("=" * 60)
print()

print(f"Arquivo: {image_path}")
print(f"Tamanho original: {image_path.stat().st_size} bytes")
print()

# Ler imagem
with open(image_path, 'rb') as f:
    image_bytes = f.read()

print(f"Bytes lidos: {len(image_bytes)}")
print(f"Primeiros bytes (hex): {image_bytes[:10].hex()}")
print()

# Tentar converter
try:
    vision = VisionService()
    converted_bytes, mime_type = vision.convert_image_to_supported_format(image_bytes)
    
    print(f"[OK] Conversao bem-sucedida!")
    print(f"     Formato: {mime_type}")
    print(f"     Tamanho convertido: {len(converted_bytes)} bytes")
    print(f"     Primeiros bytes (hex): {converted_bytes[:10].hex()}")
    
    # Verificar magic bytes
    if converted_bytes[:3] == b'\xff\xd8\xff':
        print("     [OK] Formato JPEG valido (magic bytes corretos)")
    elif converted_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        print("     [OK] Formato PNG valido (magic bytes corretos)")
    else:
        print("     [AVISO] Magic bytes nao reconhecidos")
    
    # Testar codificacao base64
    base64_image = vision.encode_image_from_bytes(converted_bytes)
    print(f"     Base64 length: {len(base64_image)} caracteres")
    print(f"     Data URI: data:{mime_type};base64,{base64_image[:50]}...")
    
    print()
    print("=" * 60)
    print("[OK] Teste concluido com sucesso!")
    print("=" * 60)
    
except Exception as e:
    print(f"[ERRO] Falha na conversao: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
