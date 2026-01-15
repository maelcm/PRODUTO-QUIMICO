"""
Serviço de Processamento de Dados
Responsável por agregação inteligente, conversão de unidades e normalização
"""

import pandas as pd
from typing import List, Dict, Any
from unidecode import unidecode


class ProcessorService:
    """Serviço para processamento e agregação de dados de estoque"""
    
    def __init__(self):
        self.unidade_padrao = "kg"  # Unidade padrão para conversão
    
    def normalizar_nome_produto(self, nome: str) -> str:
        """
        Normaliza nome do produto removendo acentos, espaços extras e convertendo para minúsculas
        
        Args:
            nome: Nome do produto original
            
        Returns:
            Nome normalizado
        """
        # Remove espaços extras e converte para minúsculas
        nome_limpo = " ".join(nome.strip().split()).lower()
        # Remove acentos
        nome_normalizado = unidecode(nome_limpo)
        return nome_normalizado
    
    def converter_para_kg(self, quantidade: float, unidade: str) -> float:
        """
        Converte quantidade para quilogramas (unidade padrão)
        
        Args:
            quantidade: Valor numérico
            unidade: Unidade original ("kg", "g", "l", "ml")
            
        Returns:
            Quantidade em quilogramas
        """
        unidade_lower = unidade.lower().strip()
        
        if unidade_lower in ["kg", "kgs", "quilograma", "quilogramas"]:
            return quantidade
        elif unidade_lower in ["g", "gms", "gr", "grama", "gramas"]:
            return quantidade / 1000.0
        elif unidade_lower in ["l", "lts", "litro", "litros"]:
            # Assumindo densidade de água (1L = 1kg) - ajustar se necessário
            return quantidade
        elif unidade_lower in ["ml", "mililitro", "mililitros"]:
            return quantidade / 1000.0
        else:
            # Se unidade desconhecida, assumir que já está em kg
            return quantidade
    
    def processar_e_agregar(self, dados_extraidos: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Processa lista de produtos extraídos:
        - Converte tudo para unidade padrão (kg)
        - Agrupa produtos duplicados
        - Soma quantidades
        
        Args:
            dados_extraidos: Lista de dicionários com produto, quantidade e unidade
            
        Returns:
            DataFrame com produtos agregados
        """
        if not dados_extraidos:
            return pd.DataFrame(columns=["produto_original", "produto_normalizado", "quantidade_kg"])
        
        # Criar DataFrame inicial
        df = pd.DataFrame(dados_extraidos)
        
        # Validar colunas necessárias
        required_cols = ["produto", "quantidade", "unidade"]
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"DataFrame deve conter as colunas: {required_cols}")
        
        # Normalizar nomes de produtos
        df["produto_original"] = df["produto"].astype(str)
        df["produto_normalizado"] = df["produto"].apply(self.normalizar_nome_produto)
        
        # Converter quantidades para float
        df["quantidade"] = pd.to_numeric(df["quantidade"], errors='coerce')
        df = df.dropna(subset=["quantidade"])  # Remover linhas com quantidade inválida
        
        # Converter tudo para kg
        df["quantidade_kg"] = df.apply(
            lambda row: self.converter_para_kg(row["quantidade"], row["unidade"]),
            axis=1
        )
        
        # Agrupar por produto normalizado e somar quantidades
        df_agregado = df.groupby("produto_normalizado").agg({
            "produto_original": "first",  # Manter o primeiro nome original encontrado
            "quantidade_kg": "sum"
        }).reset_index()
        
        # Ordenar por nome do produto
        df_agregado = df_agregado.sort_values("produto_normalizado").reset_index(drop=True)
        
        # Arredondar para 3 casas decimais
        df_agregado["quantidade_kg"] = df_agregado["quantidade_kg"].round(3)
        
        return df_agregado
    
    def calcular_consumo(self, estoque_anterior: Dict[str, float], 
                        contagem_atual: pd.DataFrame) -> pd.DataFrame:
        """
        Calcula consumo de estoque
        
        Args:
            estoque_anterior: Dicionário {produto_normalizado: quantidade_kg}
            contagem_atual: DataFrame com produtos e quantidades atuais
            
        Returns:
            DataFrame com consumo calculado
        """
        # Criar DataFrame de estoque anterior
        df_anterior = pd.DataFrame(
            list(estoque_anterior.items()),
            columns=["produto_normalizado", "estoque_anterior_kg"]
        )
        
        # Renomear coluna de contagem atual
        df_atual = contagem_atual[["produto_normalizado", "quantidade_kg"]].copy()
        df_atual = df_atual.rename(columns={"quantidade_kg": "contagem_atual_kg"})
        
        # Merge
        df_consumo = pd.merge(
            df_atual,
            df_anterior,
            on="produto_normalizado",
            how="outer",
            suffixes=("", "_anterior")
        )
        
        # Preencher NaN com 0
        df_consumo["contagem_atual_kg"] = df_consumo["contagem_atual_kg"].fillna(0)
        df_consumo["estoque_anterior_kg"] = df_consumo["estoque_anterior_kg"].fillna(0)
        
        # Calcular consumo
        df_consumo["consumo_kg"] = df_consumo["estoque_anterior_kg"] - df_consumo["contagem_atual_kg"]
        
        # Identificar produtos com consumo negativo (possível erro)
        df_consumo["alerta"] = df_consumo["consumo_kg"] < 0
        
        return df_consumo
