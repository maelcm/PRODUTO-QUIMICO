/**
 * Serviço de Integração com Google Sheets
 * Substitui o banco de dados MySQL para salvar dados diretamente no Google Sheets
 */

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface SheetsConfig {
  spreadsheetId: string;
  credentialsPath: string;
}

class SheetsService {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string;
  private credentialsPath: string;
  private initialized = false;

  constructor() {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 'credentials.json';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_ID não encontrado no arquivo .env');
    }

    this.spreadsheetId = spreadsheetId;
    this.credentialsPath = credentialsPath;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Tentar encontrar credentials.json na raiz do projeto
      const rootDir = join(__dirname, '../..');
      const credentialsFullPath = join(rootDir, this.credentialsPath);
      
      console.log('[SheetsService] Tentando carregar credenciais de:', credentialsFullPath);

      let credentials;
      try {
        const credentialsFile = readFileSync(credentialsFullPath, 'utf8');
        credentials = JSON.parse(credentialsFile);
      } catch (error: any) {
        // Tentar no diretório do servidor também
        const serverCredentialsPath = join(__dirname, '..', this.credentialsPath);
        console.log('[SheetsService] Tentando caminho alternativo:', serverCredentialsPath);
        const credentialsFile = readFileSync(serverCredentialsPath, 'utf8');
        credentials = JSON.parse(credentialsFile);
      }

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });

      // Verificar se a planilha existe e é acessível
      try {
        await this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
        });
        console.log('[SheetsService] ✅ Conectado ao Google Sheets com sucesso!');
      } catch (error: any) {
        if (error.code === 404) {
          throw new Error(`Planilha não encontrada. Verifique se o GOOGLE_SHEETS_ID está correto: ${this.spreadsheetId}`);
        } else if (error.code === 403) {
          const email = credentials.client_email || 'service-account@...';
          throw new Error(
            `❌ PERMISSÃO NEGADA: Compartilhe a planilha com: ${email}\n` +
            `ID da Planilha: ${this.spreadsheetId}`
          );
        }
        throw error;
      }

      this.initialized = true;
    } catch (error: any) {
      console.error('[SheetsService] ❌ Erro ao inicializar:', error.message);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Criar ou obter uma planilha (worksheet)
   */
  async getOrCreateWorksheet(worksheetName: string) {
    await this.ensureInitialized();

    try {
      // Tentar obter a planilha
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheet = spreadsheet.data.sheets?.find(
        (sheet: any) => sheet.properties?.title === worksheetName
      );

      if (existingSheet) {
        return worksheetName;
      }

      // Criar nova planilha se não existir
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: worksheetName,
                },
              },
            },
          ],
        },
      });

      console.log(`[SheetsService] Planilha '${worksheetName}' criada com sucesso`);
      return worksheetName;
    } catch (error: any) {
      console.error(`[SheetsService] Erro ao criar/obter planilha '${worksheetName}':`, error.message);
      throw error;
    }
  }

  /**
   * Adicionar linhas a uma planilha
   */
  async appendRows(worksheetName: string, rows: any[][]) {
    await this.ensureInitialized();

    try {
      await this.getOrCreateWorksheet(worksheetName);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${worksheetName}!A:Z`,
        // USER_ENTERED permite aplicar formatação numérica da planilha.
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: rows,
        },
      });

      return true;
    } catch (error: any) {
      console.error(`[SheetsService] Erro ao adicionar linhas:`, error.message);
      throw error;
    }
  }

  /**
   * Ler todas as linhas de uma planilha
   */
  async readRows(worksheetName: string): Promise<any[][]> {
    await this.ensureInitialized();

    try {
      await this.getOrCreateWorksheet(worksheetName);

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${worksheetName}!A:Z`,
      });

      return response.data.values || [];
    } catch (error: any) {
      console.error(`[SheetsService] Erro ao ler linhas:`, error.message);
      return [];
    }
  }

  /**
   * Limpar uma planilha (opcional, para reset)
   */
  async clearWorksheet(worksheetName: string) {
    await this.ensureInitialized();

    try {
      await this.getOrCreateWorksheet(worksheetName);

      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${worksheetName}!A:Z`,
      });

      return true;
    } catch (error: any) {
      console.error(`[SheetsService] Erro ao limpar planilha:`, error.message);
      throw error;
    }
  }
}

// Exportar instância singleton
export const sheetsService = new SheetsService();
