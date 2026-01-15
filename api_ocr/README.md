# API OCR - Sistema de Produtos Químicos

API Python para processamento OCR de listas manuscritas usando GPT-4o Vision.

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd api_ocr
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` na raiz do projeto contém:

```env
OPENAI_API_KEY=sua_chave_openai_aqui
OCR_API_URL=http://localhost:8000
```

### 3. Iniciar a API

#### Windows:
```bash
start_api.bat
```

#### Linux/Mac:
```bash
python main.py
# ou
uvicorn main:app --reload --port 8000
```

A API estará disponível em: `http://localhost:8000`

## 📡 Endpoints

### GET `/`
Retorna informações sobre a API.

### GET `/health`
Verifica o status da API e serviços.

### POST `/process-image`
Processa uma imagem enviada como arquivo.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (arquivo de imagem)

**Response:**
```json
{
  "success": true,
  "data": {
    "extracted": [...],
    "aggregated": [...]
  },
  "message": "X produtos únicos encontrados"
}
```

### POST `/process-image-bytes`
Processa uma imagem enviada como base64.

**Request:**
```json
{
  "image_base64": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extracted": [...],
    "aggregated": [...]
  },
  "message": "X produtos únicos encontrados"
}
```

## 🔧 Configuração

A API usa os serviços Python existentes:
- `VisionService` - Processamento com GPT-4o Vision
- `ProcessorService` - Agregação e processamento de dados

Certifique-se de que os arquivos estão no caminho correto:
```
PRODUTO QUIMICO/
├── services/
│   ├── vision_service.py
│   └── processor_service.py
└── api_ocr/
    └── main.py
```

## 🌐 Integração com Sistema Web

A API é chamada pelo backend Node.js através da rota:
- `POST /trpc/ocr.processImage`

O backend Node.js precisa ter configurado:
```env
OCR_API_URL=http://localhost:8000
```

## ⚠️ Requisitos

- Python 3.8+
- OpenAI API Key (GPT-4o Vision)
- Dependências instaladas (ver `requirements.txt`)

## 📝 Notas

- A API roda na porta 8000 por padrão
- CORS está configurado para aceitar requisições de `http://localhost:5173` e `http://localhost:3001`
- A API processa imagens usando GPT-4o Vision
- Os dados são agregados e normalizados antes de retornar
