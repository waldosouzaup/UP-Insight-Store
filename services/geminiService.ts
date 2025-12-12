import { GoogleGenAI } from "@google/genai";
import { StoreData, ChatMessage } from "../types";

// Initialize Gemini Client
// In a real app, ensure process.env.API_KEY is defined in your build environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateStoreInsight = async (
  userPrompt: string, 
  contextData: StoreData,
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    return "Erro de Configuração: API Key do Gemini não encontrada. Por favor, configure `process.env.API_KEY`.";
  }

  // Optimize context: Flatten data to minimize token usage while keeping relevance
  const salesSummary = contextData.sales.slice(0, 100).map(s => { // Last 100 sales
    const p = contextData.products.find(prod => prod.id === s.productId);
    return `${s.date.split('T')[0]}: Vendido ${s.quantity}x ${p?.name} (${p?.category}) por R$${s.total}`;
  }).join('\n');

  const stockSummary = contextData.inventory.map(i => {
    const p = contextData.products.find(prod => prod.id === i.productId);
    return `Produto: ${p?.name}, Estoque Atual: ${i.quantity}, Mínimo: ${p?.minStockLevel}, Custo: R$${p?.cost}, Preço: R$${p?.price}`;
  }).join('\n');

  const systemInstruction = `
    Você é o UP InsightStore, um analista de varejo especialista para uma loja física.
    
    DADOS DO SISTEMA:
    -- ESTOQUE E PRODUTOS --
    ${stockSummary}
    
    -- VENDAS RECENTES (Amostra) --
    ${salesSummary}
    
    DIRETRIZES:
    1. Responda em Português do Brasil.
    2. Seja objetivo, direto e use lógica clara.
    3. Ao gerar insights, estruture como:
       - **Evidência**: O que os dados mostram.
       - **Impacto**: Por que isso importa (financeiro/operacional).
       - **Recomendação**: Ação sugerida.
    4. Se a informação não estiver nos dados, diga que não sabe. Não alucine.
    5. Formate a saída usando Markdown (tabelas, listas, negrito).
    6. Se o usuário perguntar sobre projeções, baseie-se na tendência das vendas recentes fornecidas.
    7. Identifique produtos com estoque baixo (abaixo do nível mínimo).
  `;

  // Format history correctly for the API
  const historyParts = chatHistory.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...historyParts,
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for analytical precision
      }
    });

    return response.text || "Não consegui gerar uma análise no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, ocorreu um erro ao conectar com o módulo de inteligência.";
  }
};