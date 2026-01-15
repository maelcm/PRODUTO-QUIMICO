# 📦 Smart Inventory System

Sistema inteligente de controle de estoque que automatiza o processo através de OCR de listas manuscritas usando GPT-4o Vision.

## 🎯 Funcionalidades Principais

- **OCR Inteligente**: Extrai produtos de listas manuscritas usando GPT-4o
- **Agregação Automática**: Soma produtos duplicados automaticamente
- **Conversão de Unidades**: Padroniza todas as unidades para quilogramas (kg)
- **Normalização**: Remove acentos e espaços extras para garantir agrupamento correto
- **Cálculo de Consumo**: Calcula consumo baseado no estoque anterior
- **Integração Google Sheets**: Salva dados automaticamente no Google Sheets

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd "PRODUTO QUIMICO"
```

### 2. Instale as dependências

```bash
pip install -r requirements.txt
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
copy .env.example .env
```

Edite o arquivo `.env` e adicione:

```
OPENAI_API_KEY=sua_chave_openai_aqui
GOOGLE_SHEETS_ID=id_da_sua_planilha
GOOGLE_SHEETS_WORKSHEET=Estoque
GOOGLE_CREDENTIALS_PATH=credentials.json
```

### 4. Configure o Google Sheets

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Sheets
4. Crie uma Service Account
5. Baixe o arquivo JSON de credenciais
6. Salve como `credentials.json` na raiz do projeto
7. Compartilhe sua planilha do Google Sheets com o email da Service Account

## 📖 Como Usar

### Executar o sistema

```bash
streamlit run app.py
```

### Fluxo de trabalho

1. **Upload da Foto**: Faça upload de uma foto da lista manuscrita
2. **Processamento**: O sistema extrai os produtos usando GPT-4o
3. **Pré-visualização**: Revise os dados agregados antes de salvar
4. **Análise de Consumo**: Veja o consumo calculado baseado no estoque anterior
5. **Salvar**: Confirme para salvar no Google Sheets

## 🔧 Estrutura do Projeto

```
.
├── app.py                      # Interface Streamlit principal
├── services/
│   ├── __init__.py
│   ├── vision_service.py       # Serviço de OCR com GPT-4o
│   ├── processor_service.py    # Agregação e conversão de unidades
│   └── sheets_service.py       # Integração com Google Sheets
├── requirements.txt            # Dependências Python
├── .env.example               # Exemplo de configuração
└── README.md                  # Este arquivo
```

## 📋 Regras de Negócio

### 1. OCR e Interpretação
- Identifica abreviações comuns (gms, kgs, gr, etc.)
- Extrai produto, quantidade e unidade
- Retorna JSON estruturado

### 2. Agrupamento Inteligente
- **Passo A**: Converte tudo para kg (unidade padrão)
- **Passo B**: Agrupa produtos duplicados e soma quantidades
- **Passo C**: Normaliza nomes (remove acentos, espaços extras)

### 3. Cálculo de Consumo
- `Consumo = Estoque Anterior - Contagem Atual`
- Alerta se consumo for negativo (possível erro)

## 🛠️ Tecnologias

- **Frontend**: Streamlit
- **AI Engine**: OpenAI GPT-4o Vision
- **Backend**: Python 3.8+
- **Processamento**: Pandas
- **Database**: Google Sheets API

## 📝 Notas

- O sistema assume densidade de água para conversão de litros (1L = 1kg)
- Produtos são normalizados para comparação (sem acentos, minúsculas)
- A unidade padrão é quilogramas (kg)

## ⚠️ Troubleshooting

### Erro: "OPENAI_API_KEY não encontrada"
- Verifique se o arquivo `.env` existe e contém a chave correta

### Erro: "Arquivo de credenciais não encontrado"
- Baixe o arquivo JSON de credenciais do Google Cloud Console
- Salve como `credentials.json` na raiz do projeto

### Erro: "GOOGLE_SHEETS_ID não encontrado"
- Adicione o ID da planilha no arquivo `.env`
- O ID está na URL da planilha: `https://docs.google.com/spreadsheets/d/ID_AQUI/edit`

## 📄 Licença

Este projeto é de uso interno.
