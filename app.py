"""
Smart Inventory System
Sistema de controle de estoque automatizado via OCR de listas manuscritas
"""

import streamlit as st
import pandas as pd
from PIL import Image
import io
from datetime import datetime
from pathlib import Path
from services.vision_service import VisionService
from services.processor_service import ProcessorService
from services.sheets_service import SheetsService

# Configuração da página
st.set_page_config(
    page_title="Smart Inventory System",
    page_icon="📦",
    layout="wide"
)

# Verificar se arquivo .env existe
env_exists = Path(".env").exists()

# Título e descrição
st.title("📦 Smart Inventory System")
st.markdown("""
**Sistema Inteligente de Controle de Estoque**

Faça upload de uma foto da lista de produção **pré-formatada** e o sistema irá:
- 🔍 Identificar automaticamente produtos com data/quantidade preenchidos
- ⚠️ Ignorar produtos sem dados (não foram usados)
- 🔄 Converter e padronizar unidades de medida
- ➕ Agrupar produtos duplicados
- 💾 Salvar no Google Sheets

**📋 Formato da Lista:**
- Lista pré-impressa com todos os produtos
- Funcionário preenche apenas **DATA** e **QUANTIDADE** nos produtos usados
- Produtos sem preenchimento são automaticamente ignorados
""")

# Alerta se .env não existe
if not env_exists:
    st.warning("""
    ⚠️ **Arquivo de configuração não encontrado!**
    
    Para usar o sistema, você precisa criar um arquivo `.env` na raiz do projeto.
    
    **Passos:**
    1. Copie o arquivo `config_example.txt` para `.env`
    2. Preencha com suas credenciais:
       - `OPENAI_API_KEY`: Sua chave da OpenAI (obtenha em https://platform.openai.com/api-keys)
       - `GOOGLE_SHEETS_ID`: ID da sua planilha do Google Sheets
       - `GOOGLE_CREDENTIALS_PATH`: Caminho para o arquivo JSON de credenciais (geralmente `credentials.json`)
    
    Após criar o arquivo `.env`, recarregue a página.
    """)

# Inicializar serviços
@st.cache_resource
def init_services():
    """Inicializa serviços (cacheado para melhor performance)"""
    import os
    from dotenv import load_dotenv
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    vision = None
    processor = None
    sheets = None
    errors = []
    config_status = {}
    
    # Verificar variáveis de ambiente
    openai_key = os.getenv("OPENAI_API_KEY")
    sheets_id = os.getenv("GOOGLE_SHEETS_ID")
    creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
    
    config_status["OPENAI_API_KEY"] = "✅ Configurada" if openai_key else "❌ Não configurada"
    config_status["GOOGLE_SHEETS_ID"] = "✅ Configurado" if sheets_id else "❌ Não configurado"
    config_status["GOOGLE_CREDENTIALS"] = "✅ Encontrado" if Path(creds_path).exists() else f"❌ Não encontrado ({creds_path})"
    
    # Inicializar ProcessorService (não precisa de configuração)
    try:
        processor = ProcessorService()
    except Exception as e:
        errors.append(("ProcessorService", str(e)))
    
    # Inicializar VisionService
    if openai_key:
        try:
            vision = VisionService()
        except ValueError as e:
            errors.append(("VisionService", f"Erro de configuração: {str(e)}"))
        except Exception as e:
            errors.append(("VisionService", f"Erro inesperado: {str(e)}"))
    else:
        errors.append(("VisionService", "OPENAI_API_KEY não configurada no arquivo .env"))
    
    # Inicializar SheetsService
    if sheets_id:
        try:
            sheets = SheetsService()
        except ValueError as e:
            errors.append(("SheetsService", f"Erro de configuração: {str(e)}"))
        except FileNotFoundError as e:
            errors.append(("SheetsService", f"Arquivo não encontrado: {str(e)}"))
        except Exception as e:
            # Capturar mensagem completa do erro com mais detalhes
            error_type = type(e).__name__
            error_msg = str(e) if str(e) else "Sem mensagem de erro"
            
            # Adicionar informações adicionais se disponíveis
            full_error = f"{error_type}: {error_msg}"
            
            # Se for um erro de API do Google, adicionar dicas
            if "APIError" in error_type or "403" in error_msg or "permission" in error_msg.lower():
                full_error += "\n\n💡 Dica: Verifique se a planilha foi compartilhada com o email da Service Account"
            elif "SpreadsheetNotFound" in error_type or "404" in error_msg:
                full_error += "\n\n💡 Dica: Verifique se o GOOGLE_SHEETS_ID está correto na URL da planilha"
            
            errors.append(("SheetsService", full_error))
    else:
        errors.append(("SheetsService", "GOOGLE_SHEETS_ID não configurado no arquivo .env"))
    
    return vision, processor, sheets, errors, config_status

vision, processor, sheets, init_errors, config_status = init_services()

# Exibir status da configuração
if init_errors or not all("✅" in status for status in config_status.values()):
    with st.expander("⚠️ Status da Configuração", expanded=True):
        st.markdown("### 📋 Variáveis de Ambiente:")
        for key, status in config_status.items():
            st.markdown(f"- **{key}**: {status}")
        
        if init_errors:
            st.markdown("---")
            st.markdown("### ❌ Erros Encontrados:")
            for service_name, error_msg in init_errors:
                st.error(f"**{service_name}:** {error_msg}")
        
        st.markdown("---")
        st.markdown("### 🔧 Como Corrigir:")
        
        if "❌" in config_status["OPENAI_API_KEY"]:
            st.info("""
            **Para configurar OPENAI_API_KEY:**
            1. Abra o arquivo `.env` na raiz do projeto
            2. Adicione a linha: `OPENAI_API_KEY=sua_chave_aqui`
            3. Obtenha sua chave em: https://platform.openai.com/api-keys
            4. Recarregue esta página
            """)
        
        if "❌" in config_status["GOOGLE_SHEETS_ID"]:
            st.info("""
            **Para configurar GOOGLE_SHEETS_ID:**
            1. Abra o arquivo `.env` na raiz do projeto
            2. Adicione a linha: `GOOGLE_SHEETS_ID=id_da_sua_planilha`
            3. O ID está na URL da planilha: `https://docs.google.com/spreadsheets/d/ID_AQUI/edit`
            4. Recarregue esta página
            """)
        
        if "❌" in config_status["GOOGLE_CREDENTIALS"]:
            import os
            creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
            st.info(f"""
            **Para configurar credenciais do Google:**
            1. Acesse o Google Cloud Console: https://console.cloud.google.com/
            2. Crie um projeto ou selecione um existente
            3. Ative a API do Google Sheets
            4. Crie uma Service Account
            5. Baixe o arquivo JSON de credenciais
            6. Salve como `{creds_path}` na raiz do projeto
            7. Compartilhe sua planilha do Google Sheets com o email da Service Account
            8. Recarregue esta página
            """)

# Sidebar com informações
with st.sidebar:
    st.header("ℹ️ Informações")
    
    # Status da configuração
    st.subheader("📊 Status da Configuração")
    
    if not env_exists:
        st.error("❌ Arquivo `.env` não encontrado")
        st.info("Crie o arquivo `.env` com suas configurações")
    else:
        st.success("✅ Arquivo `.env` encontrado")
    
    col1, col2 = st.columns(2)
    with col1:
        if vision:
            st.success("✅ Vision")
        else:
            st.error("❌ Vision")
    
    with col2:
        if sheets:
            st.success("✅ Sheets")
        else:
            st.warning("⚠️ Sheets")
    
    st.markdown("---")
    st.markdown("""
    ### Como usar:
    1. Tire uma foto da lista pré-formatada
    2. Faça upload da foto
    3. Sistema processa apenas produtos com dados preenchidos
    4. Revise os dados extraídos
    5. Confirme para salvar
    
    ### ⚠️ Importante:
    - Apenas produtos com **DATA e QUANTIDADE** preenchidos serão processados
    - Produtos sem preenchimento são automaticamente ignorados
    
    ### Unidades suportadas:
    - **Peso:** kg, kgs, g, gms, gr
    - **Volume:** L, lts, ml (convertido para kg)
    """)
    
    if st.button("🔄 Atualizar Estoque Atual"):
        if sheets:
            try:
                estoque = sheets.ler_estoque_atual()
                st.success(f"✅ {len(estoque)} produtos no estoque")
                st.json(estoque)
            except Exception as e:
                st.error(f"Erro: {str(e)}")
        else:
            st.warning("Serviço do Google Sheets não disponível")
    
    st.markdown("---")
    if st.button("🔄 Limpar Cache e Recarregar"):
        st.cache_resource.clear()
        st.rerun()

# Upload de imagem
st.header("📸 Upload de Foto")
uploaded_file = st.file_uploader(
    "Selecione ou tire uma foto da lista de produção pré-formatada",
    type=["jpg", "jpeg", "png", "gif", "webp"],
    help="Lista pré-formatada: apenas produtos com DATA e QUANTIDADE preenchidos serão processados. Produtos sem preenchimento são ignorados automaticamente."
)

if uploaded_file is not None:
    # Exibir imagem
    image = Image.open(uploaded_file)
    st.image(image, caption="Imagem carregada", width='stretch')
    
    # Botão para processar
    if st.button("🔍 Processar Imagem", type="primary"):
        if not processor:
            st.error("❌ **Erro:** ProcessorService não inicializado. Verifique os logs acima.")
        elif not vision:
            st.error("❌ **Erro:** VisionService não inicializado.")
            st.warning("""
            **Para processar imagens, você precisa:**
            1. Criar um arquivo `.env` na raiz do projeto
            2. Adicionar sua chave da OpenAI: `OPENAI_API_KEY=sua_chave_aqui`
            
            Obtenha sua chave em: https://platform.openai.com/api-keys
            """)
        else:
            # Ler imagem e mostrar informações
            try:
                # Resetar o ponteiro do arquivo para o início e ler bytes
                uploaded_file.seek(0)
                img_bytes = uploaded_file.read()
                
                # Garantir que leu os bytes corretamente
                if not img_bytes or len(img_bytes) == 0:
                    st.error("Erro: Não foi possível ler o arquivo de imagem.")
                    st.stop()
                
                original_size_mb = len(img_bytes) / (1024 * 1024)
                
                # Tentar obter informações da imagem
                original_dimensions = None
                file_format_name = None
                try:
                    # Criar um novo buffer a partir dos bytes (cópia para não interferir)
                    image_buffer = io.BytesIO(img_bytes)
                    image_preview = Image.open(image_buffer)
                    original_dimensions = image_preview.size
                    file_format_name = image_preview.format
                    # Fechar recursos (não usar verify pois fecha a imagem)
                    image_preview.close()
                    image_buffer.close()
                except Exception as img_error:
                    # Se não conseguir ler, ainda podemos tentar processar
                    # O erro será tratado durante a conversão
                    pass
                
                # Mostrar informações
                st.markdown("### 📊 Informações da Imagem")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Tamanho Original", f"{original_size_mb:.2f} MB")
                with col2:
                    if original_dimensions:
                        st.metric("Dimensões", f"{original_dimensions[0]}×{original_dimensions[1]}")
                    else:
                        st.metric("Dimensões", "Processando...")
                with col3:
                    if file_format_name:
                        file_format = file_format_name.upper()
                    elif uploaded_file.type:
                        file_format = uploaded_file.type.split('/')[-1].upper()
                    else:
                        file_format = "Desconhecido"
                    st.metric("Formato", file_format)
                
                st.info("🔄 **Conversão automática ativa:** A imagem será otimizada automaticamente para tamanho ideal (2-3 MB) mantendo qualidade para OCR.")
                
                with st.spinner("🔄 Otimizando imagem para tamanho ideal e processando com GPT-4o..."):
                    try:
                        # Garantir que temos os bytes corretos
                        if not img_bytes or len(img_bytes) == 0:
                            st.error("Erro: Arquivo de imagem está vazio ou não pôde ser lido.")
                            dados_extraidos = None
                        else:
                            # Criar cópia dos bytes para evitar problemas de referência
                            # Isso garante que os bytes sejam válidos quando passados para a API
                            img_bytes_copy = bytes(img_bytes)
                            
                            # A extração já faz a otimização automaticamente
                            dados_extraidos = vision.extract_inventory_from_image(img_bytes_copy)
                    except Exception as process_error:
                        error_msg = str(process_error)
                        st.error(f"Erro ao processar imagem: {error_msg}")
                        
                        # Se for erro 403, mostrar guia expandido
                        if "403" in error_msg or "Forbidden" in error_msg or "AxiosError" in error_msg or "PERMISSÃO NEGADA" in error_msg:
                            with st.expander("🔧 Como corrigir o erro 403 (Permissão Negada)", expanded=True):
                                st.markdown("""
                                **O problema:** A API da OpenAI retornou erro 403 (Permissão Negada).
                                
                                **Possíveis causas:**
                                1. **Conta sem créditos** - Você precisa adicionar créditos à sua conta OpenAI
                                2. **Limite de uso excedido** - Você atingiu o limite diário/mensal de requisições
                                3. **Chave sem permissões** - A chave não tem acesso ao GPT-4o Vision
                                4. **Conta suspensa** - Sua conta pode ter sido suspensa por falta de pagamento
                                
                                **Solução passo a passo:**
                                1. ✅ Acesse: https://platform.openai.com/account/billing
                                2. ✅ Verifique seu saldo de créditos (precisa ter créditos disponíveis)
                                3. ✅ Se necessário, adicione créditos à sua conta (método de pagamento)
                                4. ✅ Verifique seus limites em: https://platform.openai.com/account/limits
                                5. ✅ Certifique-se de que a chave API está ativa e tem permissões
                                6. ✅ Recarregue esta página (botão "Limpar Cache e Recarregar" na barra lateral)
                                7. ✅ Tente fazer upload da imagem novamente
                                
                                **Informações importantes:**
                                - O GPT-4o Vision tem custo por imagem processada
                                - Verifique os preços atualizados em: https://openai.com/pricing
                                - Se você é novo na OpenAI, pode precisar adicionar um método de pagamento primeiro
                                - Créditos gratuitos podem ter expirado ou sido consumidos
                                """)
                        
                        dados_extraidos = None

            except Exception as read_error:
                st.error(f"Erro ao ler o arquivo: {str(read_error)}")
                st.info("Tente fazer upload novamente com uma imagem válida.")
                dados_extraidos = None
            
            # Processar resultados
            if 'dados_extraidos' in locals() and dados_extraidos is not None:
                if not dados_extraidos:
                    st.warning("Nenhum produto foi encontrado na imagem.")
                else:
                    # Processar e agregar
                    try:
                        with st.spinner("Processando e agregando dados..."):
                            df_agregado = processor.processar_e_agregar(dados_extraidos)
                            
                            # Salvar no session state
                            st.session_state['df_agregado'] = df_agregado
                            st.session_state['dados_extraidos'] = dados_extraidos
                            st.session_state['processado'] = True
                            
                            st.success(f"✅ {len(df_agregado)} produtos únicos encontrados!")
                    except Exception as e:
                        error_msg = str(e)
                        st.error(f"Erro ao processar dados: {error_msg}")
                        
                        # Se for erro 403
                        if "403" in error_msg or "Forbidden" in error_msg or "AxiosError" in error_msg or "PERMISSÃO NEGADA" in error_msg:
                            with st.expander("🔧 Como corrigir o erro 403 (Permissão Negada)", expanded=True):
                                st.markdown("""
                                **O problema:** A API da OpenAI retornou erro 403 (Permissão Negada).
                                
                                **Possíveis causas:**
                                1. **Conta sem créditos** - Você precisa adicionar créditos à sua conta OpenAI
                                2. **Limite de uso excedido** - Você atingiu o limite diário/mensal de requisições
                                3. **Chave sem permissões** - A chave não tem acesso ao GPT-4o Vision
                                4. **Conta suspensa** - Sua conta pode ter sido suspensa por falta de pagamento
                                
                                **Solução passo a passo:**
                                1. ✅ Acesse: https://platform.openai.com/account/billing
                                2. ✅ Verifique seu saldo de créditos (precisa ter créditos disponíveis)
                                3. ✅ Se necessário, adicione créditos à sua conta (método de pagamento)
                                4. ✅ Verifique seus limites em: https://platform.openai.com/account/limits
                                5. ✅ Certifique-se de que a chave API está ativa e tem permissões
                                6. ✅ Recarregue esta página (botão "Limpar Cache e Recarregar" na barra lateral)
                                7. ✅ Tente fazer upload da imagem novamente
                                
                                **Informações importantes:**
                                - O GPT-4o Vision tem custo por imagem processada
                                - Verifique os preços atualizados em: https://openai.com/pricing
                                - Se você é novo na OpenAI, pode precisar adicionar um método de pagamento primeiro
                                - Créditos gratuitos podem ter expirado ou sido consumidos
                                """)
                        # Se for erro de formato de imagem
                        elif "FORMATO DE IMAGEM" in error_msg or "unsupported image" in error_msg or "invalid_image_format" in error_msg:
                            with st.expander("🔧 Como corrigir o erro de formato de imagem", expanded=True):
                                st.markdown("""
                                **O problema:** A imagem não está em um formato suportado.
                                
                                **Formatos suportados:**
                                - PNG (.png)
                                - JPEG (.jpg, .jpeg)
                                - GIF (.gif)
                                - WEBP (.webp)
                                
                                **Solução:**
                                1. Converta a imagem para um dos formatos acima
                                2. Use um editor de imagens ou conversor online
                                3. Tente fazer upload novamente
                                
                                **Dica:** O sistema converte automaticamente para JPEG, mas alguns formatos 
                                muito incomuns podem não funcionar.
                                """)
                        # Se for erro de chave inválida
                        elif "CHAVE DA API INVÁLIDA" in error_msg or "invalid_api_key" in error_msg or "401" in error_msg:
                            with st.expander("🔧 Como corrigir o erro de chave da API", expanded=True):
                                st.markdown("""
                                **O problema:** A chave da API no arquivo `.env` está incorreta.
                                
                                **Solução:**
                                1. Acesse: https://platform.openai.com/api-keys
                                2. Faça login na sua conta OpenAI
                                3. Crie uma nova chave da API (ou use uma existente)
                                4. A chave deve começar com `sk-` (exemplo: `sk-proj-...`)
                                5. **NÃO use chaves do Google** (que começam com `AIzaSy`)
                                6. Edite o arquivo `.env` e atualize: `OPENAI_API_KEY=sk-sua_chave_aqui`
                                7. Recarregue esta página
                                
                                **Importante:** 
                                - Chaves da OpenAI começam com `sk-`
                                - Chaves do Google começam com `AIzaSy`
                                - São serviços diferentes e não podem ser trocadas!
                                """)
                        else:
                            st.exception(process_error)

# Exibir pré-visualização
if st.session_state.get('processado', False):
    st.header("📋 Pré-visualização dos Dados")
    
    df_agregado = st.session_state.get('df_agregado')
    dados_extraidos = st.session_state.get('dados_extraidos', [])
    
    if df_agregado is not None and not df_agregado.empty:
        # Tabs para diferentes visualizações
        tab1, tab2 = st.tabs(["📊 Dados Agregados (Pronto para Salvar)", "🔍 Dados Extraídos (Raw)"])
        
        with tab1:
            st.markdown("**Dados processados e agregados (produtos duplicados já somados):**")
            
            # Formatar DataFrame para exibição
            df_display = df_agregado.copy()
            df_display = df_display.rename(columns={
                "produto_original": "Produto",
                "quantidade_kg": "Quantidade (kg)"
            })
            df_display = df_display[["Produto", "Quantidade (kg)"]]
            
            st.dataframe(df_display, width='stretch', hide_index=True)
            
            # Estatísticas
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total de Produtos", len(df_agregado))
            with col2:
                st.metric("Quantidade Total (kg)", f"{df_agregado['quantidade_kg'].sum():.2f}")
            with col3:
                st.metric("Produtos Únicos", len(df_agregado))
        
        with tab2:
            st.markdown("**Dados brutos extraídos da imagem (antes da agregação):**")
            df_raw = pd.DataFrame(dados_extraidos)
            st.dataframe(df_raw, width='stretch', hide_index=True)
        
        # Calcular consumo se houver estoque anterior
        if sheets and processor:
            st.header("📊 Análise de Consumo")
            
            try:
                estoque_anterior = sheets.ler_estoque_atual()
                
                if estoque_anterior:
                    df_consumo = processor.calcular_consumo(estoque_anterior, df_agregado)
                    
                    # Filtrar apenas produtos que existem no estoque anterior
                    df_consumo_filtrado = df_consumo[
                        df_consumo["estoque_anterior_kg"] > 0
                    ].copy()
                    
                    if not df_consumo_filtrado.empty:
                        # Formatar para exibição
                        df_consumo_display = df_consumo_filtrado[[
                            "produto_normalizado",
                            "estoque_anterior_kg",
                            "contagem_atual_kg",
                            "consumo_kg",
                            "alerta"
                        ]].copy()
                        
                        df_consumo_display = df_consumo_display.rename(columns={
                            "produto_normalizado": "Produto",
                            "estoque_anterior_kg": "Estoque Anterior (kg)",
                            "contagem_atual_kg": "Contagem Atual (kg)",
                            "consumo_kg": "Consumo (kg)",
                            "alerta": "⚠️ Alerta"
                        })
                        
                        st.dataframe(df_consumo_display, width='stretch', hide_index=True)
                        
                        # Verificar alertas
                        produtos_com_alerta = df_consumo_filtrado[df_consumo_filtrado["alerta"]]
                        if not produtos_com_alerta.empty:
                            st.warning("⚠️ **Atenção:** Os seguintes produtos têm consumo negativo (possível erro de contagem ou entrada não registrada):")
                            for _, row in produtos_com_alerta.iterrows():
                                st.error(
                                    f"**{row['produto_normalizado']}**: "
                                    f"Estoque anterior: {row['estoque_anterior_kg']:.2f} kg | "
                                    f"Contagem atual: {row['contagem_atual_kg']:.2f} kg | "
                                    f"Consumo: {row['consumo_kg']:.2f} kg"
                                )
                    else:
                        st.info("Nenhum produto da contagem atual existe no estoque anterior.")
                else:
                    st.info("Estoque anterior vazio. Esta será a primeira contagem.")
                    
            except Exception as e:
                st.warning(f"Não foi possível calcular consumo: {str(e)}")
        
        # Botão para salvar
        st.header("💾 Salvar no Google Sheets")
        
        col1, col2 = st.columns([1, 4])
        with col1:
            if st.button("✅ Confirmar e Salvar", type="primary"):
                if sheets:
                    with st.spinner("Salvando no Google Sheets..."):
                        try:
                            sheets.salvar_contagem(df_agregado)
                            st.success("✅ Dados salvos com sucesso no Google Sheets!")
                            st.balloons()
                            
                            # Limpar session state
                            st.session_state['processado'] = False
                            st.session_state['df_agregado'] = None
                            st.session_state['dados_extraidos'] = None
                            
                            # Recarregar página após 2 segundos
                            st.rerun()
                            
                        except Exception as e:
                            st.error(f"Erro ao salvar: {str(e)}")
                            st.exception(e)
                else:
                    st.error("Serviço do Google Sheets não disponível.")
        
        with col2:
            if st.button("🔄 Processar Novamente"):
                st.session_state['processado'] = False
                st.session_state['df_agregado'] = None
                st.session_state['dados_extraidos'] = None
                st.rerun()

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray;'>
    <small>Smart Inventory System v1.0 | Powered by GPT-4o Vision</small>
</div>
""", unsafe_allow_html=True)
