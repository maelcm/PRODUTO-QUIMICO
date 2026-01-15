"""
API Python para processamento OCR
Integra com o sistema Web NF-e para processar listas manuscritas
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import sys
import os
from pathlib import Path

# Adicionar o diretório raiz ao path para importar os serviços
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

from services.vision_service import VisionService
from services.processor_service import ProcessorService

app = FastAPI(title="API OCR - Sistema de Produtos Químicos")

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar serviços
vision_service = None
processor_service = None

def get_vision_service():
    global vision_service
    if vision_service is None:
        try:
            vision_service = VisionService()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao inicializar VisionService: {str(e)}")
    return vision_service

def get_processor_service():
    global processor_service
    if processor_service is None:
        processor_service = ProcessorService()
    return processor_service

@app.get("/")
async def root():
    return {"message": "API OCR - Sistema de Produtos Químicos", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "ok", "services": {"vision": vision_service is not None, "processor": processor_service is not None}}

@app.post("/process-image")
async def process_image(file: UploadFile = File(...)):
    """
    Processa uma imagem e retorna produtos extraídos
    """
    try:
        # Validar tipo de arquivo
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
        
        # Ler bytes da imagem
        image_bytes = await file.read()
        
        if not image_bytes or len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Arquivo de imagem está vazio")
        
        # Processar imagem com VisionService
        vision = get_vision_service()
        dados_extraidos = vision.extract_inventory_from_image(image_bytes)
        
        if not dados_extraidos:
            return JSONResponse({
                "success": True,
                "data": {
                    "extracted": [],
                    "aggregated": []
                },
                "message": "Nenhum produto encontrado na imagem"
            })
        
        # Processar e agregar dados
        processor = get_processor_service()
        df_agregado = processor.processar_e_agregar(dados_extraidos)
        
        # Converter DataFrame para formato JSON
        extracted_data = dados_extraidos
        aggregated_data = df_agregado.to_dict('records') if not df_agregado.empty else []
        
        return JSONResponse({
            "success": True,
            "data": {
                "extracted": extracted_data,
                "aggregated": aggregated_data
            },
            "message": f"{len(aggregated_data)} produtos únicos encontrados"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")

@app.post("/process-image-bytes")
async def process_image_bytes(image_data: Dict[str, Any]):
    """
    Processa uma imagem a partir de bytes em base64
    """
    try:
        import base64
        
        if "image_base64" not in image_data:
            raise HTTPException(status_code=400, detail="Campo 'image_base64' é obrigatório")
        
        # Decodificar base64
        image_base64 = image_data["image_base64"]
        if image_base64.startswith("data:image"):
            # Remover prefixo data:image/...;base64,
            image_base64 = image_base64.split(",")[1]
        
        image_bytes = base64.b64decode(image_base64)
        
        if not image_bytes or len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Imagem decodificada está vazia")
        
        # Processar imagem
        vision = get_vision_service()
        dados_extraidos = vision.extract_inventory_from_image(image_bytes)
        
        if not dados_extraidos:
            return JSONResponse({
                "success": True,
                "data": {
                    "extracted": [],
                    "aggregated": []
                },
                "message": "Nenhum produto encontrado na imagem"
            })
        
        # Processar e agregar dados
        processor = get_processor_service()
        df_agregado = processor.processar_e_agregar(dados_extraidos)
        
        # Converter DataFrame para formato JSON
        extracted_data = dados_extraidos
        aggregated_data = df_agregado.to_dict('records') if not df_agregado.empty else []
        
        return JSONResponse({
            "success": True,
            "data": {
                "extracted": extracted_data,
                "aggregated": aggregated_data
            },
            "message": f"{len(aggregated_data)} produtos únicos encontrados"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
