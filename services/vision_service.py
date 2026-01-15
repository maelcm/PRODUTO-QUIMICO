"""
Serviço de Visão Computacional usando OpenAI GPT-4o
Responsável por OCR e extração estruturada de dados de listas manuscritas
"""

import base64
import json
import os
from typing import List, Dict, Any, Tuple
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class VisionService:
    """Serviço para processamento de imagens com GPT-4o Vision"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY não encontrada no arquivo .env")
        
        # Validar formato da chave (OpenAI keys começam com "sk-")
        api_key_clean = api_key.strip()
        if not api_key_clean.startswith("sk-"):
            raise ValueError(
                f"Chave da API inválida. A chave da OpenAI deve começar com 'sk-'.\n"
                f"Chave fornecida começa com: {api_key_clean[:10]}...\n\n"
                "⚠️ ATENÇÃO: Você pode estar usando uma chave do Google em vez da OpenAI.\n"
                "Obtenha sua chave da OpenAI em: https://platform.openai.com/api-keys"
            )
        
        self.client = OpenAI(api_key=api_key_clean)
        # Tentar gpt-4o primeiro, mas ter gpt-4o-mini como fallback (mais barato)
        self.model = "gpt-4o"
        self.fallback_model = "gpt-4o-mini"
    
    def encode_image(self, image_path: str) -> str:
        """Codifica imagem em base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def encode_image_from_bytes(self, image_bytes: bytes) -> str:
        """Codifica imagem a partir de bytes"""
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def convert_image_to_supported_format(self, image_bytes: bytes, target_size_mb: float = 1.5) -> Tuple[bytes, str]:
        """
        Converte imagem para formato suportado pela OpenAI (PNG ou JPEG)
        
        Args:
            image_bytes: Bytes da imagem original
            
        Returns:
            Tupla (bytes_convertidos, formato_mime)
        """
        from PIL import Image
        import io
        
        try:
            # Validar que temos bytes
            if not image_bytes or len(image_bytes) == 0:
                raise Exception("Arquivo de imagem está vazio")
            
            # Abrir imagem com PIL
            try:
                image = Image.open(io.BytesIO(image_bytes))
                # Forçar carregamento completo da imagem
                image.load()
            except Exception as e:
                raise Exception(f"Não foi possível abrir a imagem: {str(e)}")
            
            # Verificar se a imagem foi carregada corretamente
            if image.size[0] == 0 or image.size[1] == 0:
                raise Exception("Imagem tem dimensões inválidas")
            
            # Converter para RGB se necessário (remove transparência)
            if image.mode in ('RGBA', 'LA', 'P'):
                # Criar fundo branco para imagens com transparência
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                # Colar imagem com máscara de transparência
                if image.mode in ('RGBA', 'LA'):
                    rgb_image.paste(image, mask=image.split()[-1])
                else:
                    rgb_image.paste(image)
                image = rgb_image
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Converter para JPEG (formato mais compatível)
            # A API da OpenAI tem limite de ~20MB para base64, mas para evitar 403
            # vamos manter imagens bem pequenas (limite de segurança)
            max_size_bytes = 1_500_000  # ~1.5MB (muito conservador para evitar 403)
            
            # Redimensionar imagem se for muito grande (mantém proporção)
            # Reduzir AGressivamente para evitar 403: máximo de 1536px
            max_dimension = 1536  # Reduzido para evitar 403
            if image.size[0] > max_dimension or image.size[1] > max_dimension:
                # Calcular novo tamanho mantendo proporção
                ratio = min(max_dimension / image.size[0], max_dimension / image.size[1])
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Tentar diferentes níveis de qualidade (mais baixos primeiro)
            # Qualidades menores = arquivos menores = menos chance de 403
            qualities = [70, 60, 50, 45]
            jpeg_bytes = None
            
            for quality in qualities:
                output = io.BytesIO()
                image.save(output, format='JPEG', quality=quality, optimize=True)
                output.seek(0)
                test_bytes = output.getvalue()
                
                if len(test_bytes) <= max_size_bytes:
                    jpeg_bytes = test_bytes
                    break
            
            # Se ainda for muito grande, reduzir dimensões AGressivamente
            if jpeg_bytes is None or len(jpeg_bytes) > max_size_bytes:
                # Reduzir para máximo 1024px para garantir que fique pequena
                target_max = 1024
                if image.size[0] > target_max or image.size[1] > target_max:
                    ratio = min(target_max / image.size[0], target_max / image.size[1])
                    new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                else:
                    # Se ainda estiver grande, reduzir pela metade
                    new_size = (image.size[0] // 2, image.size[1] // 2)
                
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                
                output = io.BytesIO()
                image.save(output, format='JPEG', quality=60, optimize=True)  # Qualidade baixa
                output.seek(0)
                jpeg_bytes = output.getvalue()
            
            # Se ainda falhar, tentar PNG como último recurso
            if jpeg_bytes is None or len(jpeg_bytes) == 0:
                output_png = io.BytesIO()
                image.save(output_png, format='PNG', optimize=True)
                output_png.seek(0)
                png_bytes = output_png.getvalue()
                if len(png_bytes) > 0:
                    return png_bytes, "image/png"
                else:
                    raise Exception("Falha ao converter imagem para formato suportado")
            
            # Verificar se a conversão funcionou
            if not jpeg_bytes or len(jpeg_bytes) == 0:
                raise Exception("Falha na conversão da imagem - arquivo vazio gerado")
            
            # Verificar se é realmente JPEG (magic bytes: FF D8 FF)
            if jpeg_bytes[:3] != b'\xff\xd8\xff':
                # Tentar novamente com PNG se JPEG falhar
                output_png = io.BytesIO()
                image.save(output_png, format='PNG', optimize=True)
                output_png.seek(0)
                png_bytes = output_png.getvalue()
                if len(png_bytes) > 0:
                    return png_bytes, "image/png"
                else:
                    raise Exception("Falha na conversão da imagem para PNG")
            
            return jpeg_bytes, "image/jpeg"
            
        except Exception as e:
            raise Exception(
                f"Erro ao processar imagem: {str(e)}\n"
                "Certifique-se de que o arquivo é uma imagem válida."
            )
    
    def extract_inventory_from_image(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extrai lista de produtos de uma imagem manuscrita
        
        Args:
            image_bytes: Bytes da imagem
            
        Returns:
            Lista de dicionários com produto, quantidade e unidade
        """
        # Converter imagem para formato suportado
        converted_bytes = None
        mime_type = "image/jpeg"  # Padrão
        
        try:
            converted_bytes, mime_type = self.convert_image_to_supported_format(image_bytes)
            
            # Validar que temos bytes válidos
            if not converted_bytes or len(converted_bytes) == 0:
                raise Exception("Imagem convertida está vazia")
            
            # Garantir que o formato MIME está correto
            if mime_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
                # Se o formato não for reconhecido, forçar JPEG
                mime_type = "image/jpeg"
                
        except Exception as e:
            raise Exception(f"Erro ao converter imagem: {str(e)}")
        
        # Validar formato final antes de enviar
        if mime_type == "image/jpeg":
            # Verificar magic bytes do JPEG
            if converted_bytes[:3] != b'\xff\xd8\xff':
                # Se não for JPEG válido, tentar converter novamente
                from PIL import Image
                import io
                try:
                    image = Image.open(io.BytesIO(converted_bytes))
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    output = io.BytesIO()
                    image.save(output, format='JPEG', quality=95)
                    converted_bytes = output.getvalue()
                except:
                    pass
        
        # Codificar em base64
        try:
            base64_image = self.encode_image_from_bytes(converted_bytes)
            
            # Validar que a codificação funcionou
            if not base64_image or len(base64_image) == 0:
                raise Exception("Falha ao codificar imagem em base64")
            
            # Validar tamanho mínimo (imagens muito pequenas podem ser inválidas)
            if len(base64_image) < 100:
                raise Exception("Imagem convertida é muito pequena - possível erro na conversão")
                
        except Exception as e:
            raise Exception(f"Erro ao codificar imagem: {str(e)}")
        
        prompt = """Você é um especialista em OCR e interpretação de listas de produção pré-formatadas.

IMPORTANTE: Esta é uma lista pré-impressa onde:
- Os NOMES DOS PRODUTOS já estão impressos na lista
- O funcionário APENAS preenche DATA e QUANTIDADE nos produtos que foram USADOS
- Produtos SEM data/quantidade preenchida NÃO foram usados e devem ser IGNORADOS

REGRAS CRÍTICAS:

1. EXTRAIR APENAS PRODUTOS COM DADOS PREENCHIDOS:
   - Só processe produtos que têm DATA e QUANTIDADE preenchidas
   - IGNORE completamente produtos onde os campos de data/quantidade estão VAZIOS
   - IGNORE linhas/produtos onde só tem o nome impresso mas sem dados preenchidos

2. Identificar unidades de medida (mesmo com abreviações):
   - "gms", "gr", "g" = gramas
   - "kgs", "kg", "KG" = quilogramas
   - "ml", "mL" = mililitros
   - "L", "lts", "litros" = litros

3. Para cada produto COM DADOS PREENCHIDOS, extraia:
   - Nome do produto (use o nome IMPRESSO, não o manuscrito - está mais claro e correto)
   - Quantidade numérica (o valor manuscrito)
   - Unidade de medida (padronize para "kg" ou "g" - converta litros/ml para kg quando aplicável)

4. Formato das quantidades:
   - Se a quantidade estiver em gramas, mantenha em gramas
   - Se estiver em kg, mantenha em kg
   - Exemplo: "850 gms" → quantidade: 850, unidade: "g"
   - Exemplo: "25 kgs" → quantidade: 25, unidade: "kg"
   - Exemplo: "1.5 kg" → quantidade: 1.5, unidade: "kg"

5. Retorne APENAS um JSON válido no formato:
   [
     {
       "produto": "nome do produto (use o nome impresso)",
       "quantidade": valor_numerico,
       "unidade": "kg" ou "g"
     }
   ]

6. LEMBRE-SE: Se um produto tem nome impresso mas os campos de data/quantidade estão vazios, NÃO inclua esse produto no JSON.

7. NÃO adicione comentários ou texto adicional, APENAS o JSON."""

        # Validar tamanho da imagem codificada (limite da OpenAI é ~20MB)
        image_size_mb = len(base64_image) * 3 / 4 / (1024 * 1024)  # Aproximação: base64 é ~33% maior
        
        # Se a imagem ainda estiver muito grande (>2MB após conversão), reduzir mais
        if image_size_mb > 2.0:
            from PIL import Image
            import io
            try:
                image = Image.open(io.BytesIO(converted_bytes))
                # Redimensionar para garantir que fique menor
                max_dim = 1536  # Reduzir para 1536px se ainda estiver muito grande
                if image.width > max_dim or image.height > max_dim:
                    if image.width > image.height:
                        new_width = max_dim
                        new_height = int(image.height * (max_dim / image.width))
                    else:
                        new_height = max_dim
                        new_width = int(image.width * (max_dim / image.height))
                    
                    image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    
                    output = io.BytesIO()
                    image.save(output, format='JPEG', quality=75, optimize=True)
                    converted_bytes = output.getvalue()
                    base64_image = self.encode_image_from_bytes(converted_bytes)
                    mime_type = "image/jpeg"
            except:
                pass  # Se falhar, continuar com a imagem original
        
        # SEMPRE usar "low" para evitar 403 e reduzir custos
        # "low" é suficiente para OCR de listas impressas
        detail_level = "low"
        
        try:
            # SEMPRE usar "low" (mais econômico e evita 403)
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}",
                                        "detail": "low"  # Usar "low" para economizar créditos e evitar 403
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=2000,
                    temperature=0.1
                )
            except Exception as first_error:
                error_str = str(first_error)
                # Se der erro 403 ou de créditos, tentar reduzir ainda mais
                if "403" in error_str or "insufficient_quota" in error_str.lower() or "credit" in error_str.lower():
                    # Tentar comprimir mais a imagem
                    from PIL import Image
                    import io
                    try:
                        image = Image.open(io.BytesIO(converted_bytes))
                        # Redimensionar para no máximo 2048px na maior dimensão
                        max_dim = 2048
                        if image.width > max_dim or image.height > max_dim:
                            if image.width > image.height:
                                new_width = max_dim
                                new_height = int(image.height * (max_dim / image.width))
                            else:
                                new_height = max_dim
                                new_width = int(image.width * (max_dim / image.height))
                            
                            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                            
                            # Converter para RGB se necessário
                            if image.mode != 'RGB':
                                image = image.convert('RGB')
                            
                            # Salvar com qualidade reduzida
                            output = io.BytesIO()
                            image.save(output, format='JPEG', quality=75, optimize=True)
                            converted_bytes = output.getvalue()
                            base64_image = self.encode_image_from_bytes(converted_bytes)
                            mime_type = "image/jpeg"
                            
                            # Tentar novamente com imagem reduzida
                            response = self.client.chat.completions.create(
                                model=self.model,
                                messages=[
                                    {
                                        "role": "user",
                                        "content": [
                                            {
                                                "type": "text",
                                                "text": prompt
                                            },
                                            {
                                                "type": "image_url",
                                                "image_url": {
                                                    "url": f"data:{mime_type};base64,{base64_image}",
                                                    "detail": "low"
                                                }
                                            }
                                        ]
                                    }
                                ],
                                max_tokens=2000,
                                temperature=0.1
                            )
                        else:
                            raise first_error
                    except:
                        raise first_error
                else:
                    raise first_error
            
            # Extrair resposta
            content = response.choices[0].message.content.strip()
            
            # Limpar resposta (remover markdown code blocks se houver)
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Parse JSON
            data = json.loads(content)
            
            if not isinstance(data, list):
                raise ValueError("Resposta da IA não é uma lista")
            
            return data
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Erro ao decodificar JSON da IA: {e}\nResposta recebida: {content}")
        except Exception as e:
            error_str = str(e)
            error_type = type(e).__name__
            
            # Tentar extrair detalhes do erro da API
            error_details = ""
            try:
                response_obj = getattr(e, 'response', None)
                if response_obj is not None:
                    try:
                        if hasattr(response_obj, 'json'):
                            error_data = response_obj.json()
                            error_details = str(error_data)
                        elif hasattr(response_obj, 'text'):
                            error_details = response_obj.text
                    except:
                        pass
                # Tentar obter detalhes do objeto de erro da OpenAI
                body = getattr(e, 'body', None)
                if body:
                    error_details = str(body)
                else:
                    message = getattr(e, 'message', None)
                    if message:
                        error_details = str(message)
            except:
                pass
            
            # Verificar se é erro 403 (permissão negada)
            if "403" in error_str or "Forbidden" in error_str or "AxiosError" in error_type or "status code 403" in error_str.lower():
                # Verificar se é da OpenAI
                if "OpenAI" in error_str or "openai" in error_str or "api.openai.com" in error_str or error_type == "APIError" or "API" in error_type:
                    # Verificar causas específicas no detalhe do erro
                    causas_especificas = []
                    
                    if "insufficient_quota" in error_str.lower() or "quota" in error_str.lower() or "credit" in error_str.lower():
                        causas_especificas.append("💰 **FALTA DE CRÉDITOS** - Sua conta OpenAI não tem créditos suficientes")
                    
                    if "rate_limit" in error_str.lower() or "rate limit" in error_str.lower():
                        causas_especificas.append("⏱️ **LIMITE DE TAXA EXCEDIDO** - Você fez muitas requisições muito rápido")
                    
                    if "access_denied" in error_str.lower() or "permission" in error_str.lower():
                        causas_especificas.append("🔒 **ACESSO NEGADO** - Sua conta pode não ter permissão para usar o GPT-4o Vision")
                    
                    if "model" in error_str.lower() and ("not available" in error_str.lower() or "not found" in error_str.lower()):
                        causas_especificas.append("🤖 **MODELO NÃO DISPONÍVEL** - O GPT-4o pode não estar disponível para sua conta")
                    
                    mensagem_causas = "\n".join(causas_especificas) if causas_especificas else "Erro 403 detectado - verifique sua conta OpenAI"
                    
                    raise Exception(
                        f"❌ ERRO 403: Permissão negada na API da OpenAI\n\n"
                        f"Erro: {error_str}\n\n"
                        f"{'Detalhes do erro: ' + error_details if error_details else ''}\n\n"
                        f"{mensagem_causas}\n\n"
                        "🔧 AÇÕES RECOMENDADAS:\n"
                        "1. ✅ **Verifique créditos:** https://platform.openai.com/account/billing\n"
                        "   - Se não tiver créditos, adicione um método de pagamento e créditos\n"
                        "2. ✅ **Verifique limites:** https://platform.openai.com/account/limits\n"
                        "   - Verifique limites de uso diário/mensal\n"
                        "   - Verifique rate limits (requisições por minuto)\n"
                        "3. ✅ **Verifique acesso ao modelo:** https://platform.openai.com/account/limits\n"
                        "   - Certifique-se de que o GPT-4o está disponível para sua conta\n"
                        "   - Algumas contas precisam fazer upgrade do plano\n"
                        "4. ✅ **Aguarde alguns minutos** se for rate limit (limite de taxa)\n"
                        "5. ✅ **Verifique status da conta:** https://platform.openai.com/account\n"
                        "   - Verifique se há notificações ou problemas\n\n"
                        "💡 **DICA:** O GPT-4o Vision tem custo por imagem. "
                        "Certifique-se de ter créditos suficientes antes de usar.\n"
                        "Preços em: https://openai.com/pricing"
                    )
                else:
                    # Erro 403 genérico
                    raise Exception(
                        f"❌ ERRO 403: Permissão negada\n\n"
                        f"Erro: {error_str}\n\n"
                        "🔧 POSSÍVEIS CAUSAS:\n"
                        "1. Problema de permissões na API\n"
                        "2. Limite de uso excedido\n"
                        "3. Credenciais inválidas ou expiradas\n\n"
                        "Verifique suas configurações no arquivo .env"
                    )
            # Verificar se é erro de formato de imagem
            elif "400" in error_str and ("unsupported image" in error_str or "invalid_image_format" in error_str):
                raise Exception(
                    f"❌ FORMATO DE IMAGEM NÃO SUPORTADO\n\n"
                    f"Erro: {error_str}\n\n"
                    "🔧 SOLUÇÃO:\n"
                    "1. Use imagens nos formatos: PNG, JPEG, GIF ou WEBP\n"
                    "2. Tente converter a imagem para JPEG ou PNG\n"
                    "3. Certifique-se de que o arquivo não está corrompido\n"
                    "4. Tente fazer upload novamente com uma imagem diferente"
                )
            # Verificar se é erro de chave inválida
            elif "401" in error_str or "invalid_api_key" in error_str or "Incorrect API key" in error_str:
                raise Exception(
                    f"❌ CHAVE DA API INVÁLIDA\n\n"
                    f"Erro: {error_str}\n\n"
                    "🔧 SOLUÇÃO:\n"
                    "1. A chave no arquivo .env está incorreta ou expirada\n"
                    "2. Verifique se está usando uma chave da OPENAI (começa com 'sk-')\n"
                    "3. NÃO use chaves do Google (que começam com 'AIzaSy')\n"
                    "4. Obtenha uma nova chave em: https://platform.openai.com/api-keys\n"
                    "5. Atualize o arquivo .env com: OPENAI_API_KEY=sk-sua_chave_aqui\n"
                    "6. Recarregue a página do Streamlit"
                )
            else:
                raise Exception(f"Erro ao processar imagem com GPT-4o: {error_str}\n\nTipo de erro: {error_type}")
