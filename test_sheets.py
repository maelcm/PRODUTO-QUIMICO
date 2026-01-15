"""
Script de teste para diagnosticar problemas com o SheetsService
Execute: python test_sheets.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Configurar encoding para UTF-8 no Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("TESTE DO SHEETSSERVICE")
print("=" * 60)
print()

# Carregar variáveis de ambiente
load_dotenv()

# Verificar configurações
print("1. Verificando configuracoes...")
print("-" * 60)

sheets_id = os.getenv("GOOGLE_SHEETS_ID")
creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")

print(f"GOOGLE_SHEETS_ID: {sheets_id if sheets_id else '[NAO CONFIGURADO]'}")
print(f"GOOGLE_CREDENTIALS_PATH: {creds_path}")

if not sheets_id:
    print("[ERRO] GOOGLE_SHEETS_ID nao configurado")
    sys.exit(1)

if not Path(creds_path).exists():
    print(f"[ERRO] Arquivo de credenciais nao encontrado: {creds_path}")
    sys.exit(1)

print("[OK] Configuracoes basicas OK")
print()

# Testar importações
print("2. Testando importacoes...")
print("-" * 60)

try:
    import gspread
    print("[OK] gspread importado")
except ImportError as e:
    print(f"[ERRO] Nao foi possivel importar gspread: {e}")
    sys.exit(1)

try:
    from gspread.exceptions import SpreadsheetNotFound, WorksheetNotFound, APIError
    print("[OK] Excecoes do gspread importadas")
except ImportError as e:
    print(f"[ERRO] Nao foi possivel importar excecoes: {e}")
    sys.exit(1)

try:
    from google.oauth2.service_account import Credentials
    print("[OK] google.oauth2 importado")
except ImportError as e:
    print(f"[ERRO] Nao foi possivel importar google.oauth2: {e}")
    sys.exit(1)

print()

# Testar autenticação
print("3. Testando autenticacao...")
print("-" * 60)

try:
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = Credentials.from_service_account_file(creds_path, scopes=scope)
    client = gspread.authorize(creds)
    print("[OK] Autenticacao bem-sucedida")
    
    # Obter email da Service Account
    service_account_email = creds.service_account_email
    print(f"[INFO] Email da Service Account: {service_account_email}")
    print()
    print("[IMPORTANTE] Certifique-se de que a planilha foi compartilhada")
    print(f"            com este email: {service_account_email}")
    print()
except Exception as e:
    print(f"[ERRO] Falha na autenticacao: {e}")
    print(f"       Tipo de erro: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Testar acesso à planilha
print("4. Testando acesso a planilha...")
print("-" * 60)

try:
    spreadsheet = client.open_by_key(sheets_id)
    print(f"[OK] Planilha acessada com sucesso")
    print(f"     Titulo: {spreadsheet.title}")
    print(f"     URL: {spreadsheet.url}")
except SpreadsheetNotFound:
    print(f"[ERRO] Planilha nao encontrada com ID: {sheets_id}")
    print("       Verifique se:")
    print("       1. O ID esta correto")
    print("       2. A planilha foi compartilhada com o email da Service Account")
    sys.exit(1)
except APIError as e:
    print(f"[ERRO] Erro da API do Google Sheets")
    print(f"       Tipo: {type(e).__name__}")
    print(f"       Mensagem: {str(e)}")
    if hasattr(e, 'response'):
        print(f"       Response: {e.response}")
    sys.exit(1)
except Exception as e:
    print(f"[ERRO] Erro inesperado ao acessar planilha")
    print(f"       Tipo: {type(e).__name__}")
    print(f"       Mensagem: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Testar worksheet
print()
print("5. Testando worksheet...")
print("-" * 60)

worksheet_name = os.getenv("GOOGLE_SHEETS_WORKSHEET", "Estoque")
print(f"Procurando worksheet: {worksheet_name}")

try:
    worksheet = spreadsheet.worksheet(worksheet_name)
    print(f"[OK] Worksheet '{worksheet_name}' encontrada")
except WorksheetNotFound:
    print(f"[AVISO] Worksheet '{worksheet_name}' nao encontrada")
    print("        Ela sera criada automaticamente quando necessario")
except Exception as e:
    print(f"[ERRO] Erro ao acessar worksheet: {e}")
    sys.exit(1)

print()
print("=" * 60)
print("[OK] Todos os testes passaram!")
print("=" * 60)
