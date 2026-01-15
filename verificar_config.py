"""
Script de diagnóstico para verificar a configuração do Smart Inventory System
Execute: python verificar_config.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Configurar encoding para UTF-8 no Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("DIAGNOSTICO DE CONFIGURACAO - Smart Inventory System")
print("=" * 60)
print()

# Verificar arquivo .env
env_path = Path(".env")
if env_path.exists():
    print("[OK] Arquivo .env encontrado")
    print(f"     Localizacao: {env_path.absolute()}")
else:
    print("[ERRO] Arquivo .env NAO encontrado")
    print("       Crie o arquivo .env na raiz do projeto")
    print()
    exit(1)

print()

# Carregar variáveis de ambiente
load_dotenv()

# Verificar variáveis
print("Verificando variaveis de ambiente:")
print("-" * 60)

# OPENAI_API_KEY
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key:
    # Mascarar a chave para segurança
    masked_key = openai_key[:7] + "..." + openai_key[-4:] if len(openai_key) > 11 else "***"
    print(f"[OK] OPENAI_API_KEY: {masked_key}")
else:
    print("[ERRO] OPENAI_API_KEY: NAO configurada")
    print("       Adicione no .env: OPENAI_API_KEY=sua_chave_aqui")

# GOOGLE_SHEETS_ID
sheets_id = os.getenv("GOOGLE_SHEETS_ID")
if sheets_id:
    print(f"[OK] GOOGLE_SHEETS_ID: {sheets_id}")
else:
    print("[ERRO] GOOGLE_SHEETS_ID: NAO configurado")
    print("       Adicione no .env: GOOGLE_SHEETS_ID=id_da_planilha")

# GOOGLE_SHEETS_WORKSHEET
worksheet = os.getenv("GOOGLE_SHEETS_WORKSHEET", "Estoque")
print(f"[INFO] GOOGLE_SHEETS_WORKSHEET: {worksheet} (padrao: Estoque)")

# GOOGLE_CREDENTIALS_PATH
creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
creds_file = Path(creds_path)
if creds_file.exists():
    print(f"[OK] GOOGLE_CREDENTIALS: {creds_path} (arquivo encontrado)")
else:
    print(f"[ERRO] GOOGLE_CREDENTIALS: {creds_path} (arquivo NAO encontrado)")
    print(f"       Baixe o arquivo JSON de credenciais do Google Cloud Console")
    print(f"       e salve como: {creds_path}")

print()
print("=" * 60)

# Resumo
print("RESUMO:")
print("-" * 60)

all_ok = True
if not openai_key:
    print("[ERRO] OPENAI_API_KEY precisa ser configurada")
    all_ok = False
if not sheets_id:
    print("[ERRO] GOOGLE_SHEETS_ID precisa ser configurado")
    all_ok = False
if not creds_file.exists():
    print("[ERRO] Arquivo de credenciais do Google precisa ser adicionado")
    all_ok = False

if all_ok:
    print("[OK] Todas as configuracoes estao corretas!")
    print("     O sistema deve funcionar normalmente.")
else:
    print()
    print("[AVISO] Corrija os itens acima e execute este script novamente.")

print("=" * 60)
