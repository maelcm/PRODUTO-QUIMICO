"""
Serviço de Integração com Google Sheets
Responsável por ler e escrever dados no Google Sheets
"""

import os
import gspread
from gspread.exceptions import SpreadsheetNotFound, WorksheetNotFound, APIError
from google.oauth2.service_account import Credentials
from typing import Dict, List, Any
import pandas as pd
from dotenv import load_dotenv

load_dotenv()


class SheetsService:
    """Serviço para integração com Google Sheets"""
    
    def __init__(self):
        # Configuração do Google Sheets
        self.spreadsheet_id = os.getenv("GOOGLE_SHEETS_ID")
        self.worksheet_name = os.getenv("GOOGLE_SHEETS_WORKSHEET", "Estoque")
        
        if not self.spreadsheet_id:
            raise ValueError("GOOGLE_SHEETS_ID não encontrado no arquivo .env")
        
        # Autenticação
        try:
            self.client = self._authenticate()
        except Exception as e:
            raise Exception(f"Erro na autenticação: {str(e)}")
        
        # Obter email da Service Account para mensagens de erro
        service_account_email = "email_da_service_account@projeto.iam.gserviceaccount.com"
        try:
            # Tentar obter do client
            if hasattr(self.client, 'auth') and hasattr(self.client.auth, 'service_account_email'):
                service_account_email = self.client.auth.service_account_email
            # Ou tentar obter das credenciais
            elif hasattr(self.client, 'auth') and hasattr(self.client.auth, 'credentials'):
                creds = self.client.auth.credentials
                if hasattr(creds, 'service_account_email'):
                    service_account_email = creds.service_account_email
        except:
            # Se não conseguir, tentar ler do arquivo JSON
            try:
                import json
                creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
                with open(creds_path, 'r') as f:
                    creds_data = json.load(f)
                    service_account_email = creds_data.get('client_email', service_account_email)
            except:
                pass
        
        # Abrir planilha
        try:
            self.spreadsheet = self.client.open_by_key(self.spreadsheet_id)
        except PermissionError:
            raise Exception(
                f"❌ PERMISSÃO NEGADA: A planilha não foi compartilhada com a Service Account\n\n"
                f"📧 Email da Service Account: {service_account_email}\n\n"
                "🔧 SOLUÇÃO:\n"
                "1. Abra sua planilha do Google Sheets\n"
                "2. Clique em 'Compartilhar' (botão no canto superior direito)\n"
                "3. Adicione o email acima com permissão de 'Editor' ou 'Visualizador'\n"
                "4. Recarregue esta página\n\n"
                f"📋 ID da Planilha: {self.spreadsheet_id}"
            )
        except SpreadsheetNotFound:
            raise Exception(
                f"❌ Planilha não encontrada com ID: {self.spreadsheet_id}\n\n"
                "Verifique se:\n"
                "1. O ID da planilha está correto (está na URL: docs.google.com/spreadsheets/d/ID_AQUI/edit)\n"
                f"2. A planilha foi compartilhada com: {service_account_email}\n"
                "3. O email da Service Account está no arquivo credentials.json"
            )
        except APIError as e:
            error_code = getattr(e, 'response', {}).get('status', 'Desconhecido') if hasattr(e, 'response') else 'Desconhecido'
            error_message = str(e)
            
            if '403' in error_message or 'PERMISSION_DENIED' in error_message:
                raise Exception(
                    f"❌ PERMISSÃO NEGADA: A planilha não foi compartilhada com a Service Account\n\n"
                    f"📧 Email da Service Account: {service_account_email}\n\n"
                    "🔧 SOLUÇÃO:\n"
                    "1. Abra sua planilha do Google Sheets\n"
                    "2. Clique em 'Compartilhar' (botão no canto superior direito)\n"
                    "3. Adicione o email acima com permissão de 'Editor' ou 'Visualizador'\n"
                    "4. Recarregue esta página\n\n"
                    f"📋 ID da Planilha: {self.spreadsheet_id}"
                )
            else:
                raise Exception(
                    f"❌ Erro da API do Google Sheets (Código: {error_code}): {error_message}\n\n"
                    "Possíveis causas:\n"
                    "1. A Service Account não tem permissão para acessar a planilha\n"
                    f"2. A planilha não foi compartilhada com: {service_account_email}\n"
                    "3. O arquivo credentials.json está inválido ou expirado"
                )
        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e) if str(e) else "Sem mensagem de erro"
            raise Exception(
                f"❌ Erro ao abrir planilha ({error_type}): {error_msg}\n\n"
                "Verifique:\n"
                "1. Se o GOOGLE_SHEETS_ID está correto\n"
                "2. Se o arquivo credentials.json é válido\n"
                f"3. Se a planilha foi compartilhada com: {service_account_email}"
            )
    
    def _authenticate(self) -> gspread.Client:
        """Autentica com Google Sheets usando service account"""
        # Verificar se há arquivo de credenciais
        creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
        
        if not os.path.exists(creds_path):
            raise FileNotFoundError(
                f"Arquivo de credenciais não encontrado: {creds_path}\n"
                "Por favor, baixe o arquivo JSON de credenciais do Google Cloud Console."
            )
        
        scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive"
        ]
        
        try:
            creds = Credentials.from_service_account_file(creds_path, scopes=scope)
            return gspread.authorize(creds)
        except Exception as e:
            raise Exception(
                f"Erro ao autenticar com Google Sheets: {str(e)}\n"
                "Verifique se o arquivo de credenciais está correto e válido."
            )
    
    def get_worksheet(self, create_if_not_exists: bool = True):
        """Obtém ou cria a worksheet"""
        try:
            return self.spreadsheet.worksheet(self.worksheet_name)
        except WorksheetNotFound:
            if create_if_not_exists:
                worksheet = self.spreadsheet.add_worksheet(
                    title=self.worksheet_name,
                    rows=1000,
                    cols=10
                )
                # Adicionar cabeçalhos
                worksheet.append_row([
                    "Produto Original",
                    "Produto Normalizado",
                    "Quantidade (kg)",
                    "Data",
                    "Timestamp"
                ])
                return worksheet
            else:
                raise
    
    def ler_estoque_atual(self) -> Dict[str, float]:
        """
        Lê o estoque atual do Google Sheets
        
        Returns:
            Dicionário {produto_normalizado: quantidade_kg}
        """
        worksheet = self.get_worksheet()
        records = worksheet.get_all_records()
        
        if not records:
            return {}
        
        # Converter para DataFrame
        df = pd.DataFrame(records)
        
        # Verificar se tem as colunas necessárias
        if "Produto Normalizado" not in df.columns or "Quantidade (kg)" not in df.columns:
            return {}
        
        # Agrupar por produto e pegar a última entrada (mais recente)
        df["Data"] = pd.to_datetime(df.get("Data", ""), errors='coerce')
        df = df.sort_values("Data", na_position='last')
        
        # Pegar último registro de cada produto
        df_ultimo = df.groupby("Produto Normalizado").last().reset_index()
        
        # Criar dicionário
        estoque = {}
        for _, row in df_ultimo.iterrows():
            produto = str(row["Produto Normalizado"]).strip()
            quantidade = pd.to_numeric(row["Quantidade (kg)"], errors='coerce')
            if pd.notna(quantidade):
                estoque[produto] = float(quantidade)
        
        return estoque
    
    def salvar_contagem(self, df_agregado: pd.DataFrame) -> bool:
        """
        Salva contagem agregada no Google Sheets
        
        Args:
            df_agregado: DataFrame com produtos agregados
            
        Returns:
            True se salvou com sucesso
        """
        from datetime import datetime
        
        worksheet = self.get_worksheet()
        
        # Preparar dados para inserção
        rows_to_add = []
        timestamp = datetime.now()
        data_str = timestamp.strftime("%Y-%m-%d")
        timestamp_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")
        
        for _, row in df_agregado.iterrows():
            rows_to_add.append([
                str(row["produto_original"]),
                str(row["produto_normalizado"]),
                float(row["quantidade_kg"]),
                data_str,
                timestamp_str
            ])
        
        # Adicionar linhas
        if rows_to_add:
            worksheet.append_rows(rows_to_add)
        
        return True
    
    def atualizar_estoque(self, df_consumo: pd.DataFrame) -> bool:
        """
        Atualiza estoque com base no consumo calculado
        
        Args:
            df_consumo: DataFrame com consumo calculado
            
        Returns:
            True se atualizou com sucesso
        """
        # Esta função pode ser expandida para atualizar uma planilha de estoque separada
        # Por enquanto, apenas retorna True
        return True
