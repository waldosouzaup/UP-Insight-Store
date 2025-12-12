import * as XLSX from 'xlsx';
import { StoreData, Product, InventoryItem, Sale } from '../types';

// Helper: Normalize keys aggressively (lowercase, remove accents, snake_case)
const normalizeKey = (key: string): string => {
  if (!key) return '';
  return key
    .toString()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents (e.g., ç -> c, é -> e)
    .trim()
    .replace(/[^a-z0-9]+/g, '_') // Replace spaces/symbols with underscore
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

export const parseSpreadsheet = (file: File): Promise<StoreData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Falha ao ler o conteúdo do arquivo.");

        let workbook;

        // Handling logic based on file type to ensure correct encoding
        if (isCSV && typeof data === 'string') {
            // CSV: Read as string (browser handles UTF-8 automatically via readAsText)
            workbook = XLSX.read(data, { type: 'string', cellDates: true });
        } else {
            // Excel: Read as binary array
            workbook = XLSX.read(data, { type: 'array', cellDates: true });
        }

        if (!workbook.SheetNames.length) {
            throw new Error("O arquivo não possui abas de dados.");
        }
        
        // Use the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonData || !jsonData.length) throw new Error("A planilha está vazia ou não pôde ser lida.");

        console.log("Exemplo de linha lida:", jsonData[0]);

        // Maps to store unique products and inventory
        const productsMap = new Map<string, Product>();
        const inventoryMap = new Map<string, InventoryItem>();
        const sales: Sale[] = [];

        // Debug: Store missing columns info
        let firstRowKeys: string[] = [];

        jsonData.forEach((row, index) => {
          // 1. Normalize the row keys
          const safeRow: any = {};
          Object.keys(row).forEach(k => {
              const cleanKey = normalizeKey(k);
              if (cleanKey) safeRow[cleanKey] = row[k];
          });

          if (index === 0) firstRowKeys = Object.keys(safeRow);

          // 2. Extract Data using multiple aliases
          
          // ID Aliases
          const rawId = 
            safeRow.product_id || safeRow.id_produto || safeRow.id || 
            safeRow.codigo || safeRow.cod || safeRow.sku || 
            safeRow.referencia || safeRow.ref || safeRow.codigo_produto;

          // Name Aliases
          const rawName = 
            safeRow.product_name || safeRow.nome_produto || safeRow.produto || 
            safeRow.name || safeRow.nome || safeRow.descricao || 
            safeRow.item || safeRow.titulo || safeRow.mercadoria;

          // Category Aliases
          const rawCategory = 
            safeRow.category || safeRow.categoria || safeRow.cat || 
            safeRow.departamento || safeRow.grupo || safeRow.secao;

          // Cost Aliases
          const rawCost = 
            safeRow.cost || safeRow.custo || safeRow.valor_custo || 
            safeRow.preco_custo || safeRow.pc || safeRow.vlr_custo;

          // Price Aliases
          const rawPrice = 
            safeRow.price || safeRow.preco || safeRow.preço || 
            safeRow.valor || safeRow.valor_venda || safeRow.preco_venda || 
            safeRow.pv || safeRow.unitario;

          // Min Stock Aliases
          const rawMinStock = 
            safeRow.min_stock || safeRow.estoque_minimo || safeRow.min || 
            safeRow.minimo || safeRow.ponto_pedido || safeRow.alertar_em;

          // Current Stock Aliases
          const rawStock = 
            safeRow.current_stock || safeRow.estoque_atual || safeRow.estoque || 
            safeRow.saldo || safeRow.quantidade_estoque || safeRow.qtd_atual;

          // Quantity Sold Aliases
          const rawQtd = 
            safeRow.quantity_sold || safeRow.quantidade_vendida || safeRow.qtd_vendida || 
            safeRow.vendas || safeRow.qtd || safeRow.quantidade || safeRow.saida;

          // Date Aliases
          const rawDate = 
            safeRow.date || safeRow.data || safeRow.data_venda || 
            safeRow.dia || safeRow.emissao || safeRow.data_movimento;

          // --- Validation ---
          if (!rawId || !rawName) {
            // Skip invalid rows silently after the first few to avoid log spam
            if (index < 3) {
              console.warn(`Linha ${index + 1} ignorada. ID ou Nome não encontrados.`, safeRow);
            }
            return;
          }

          const pid = String(rawId).trim();

          // --- Build Product ---
          if (!productsMap.has(pid)) {
            productsMap.set(pid, {
              id: pid,
              name: String(rawName).trim(),
              category: rawCategory ? String(rawCategory).trim() : 'Geral',
              cost: parseFloat(String(rawCost).replace(',', '.')) || 0,
              price: parseFloat(String(rawPrice).replace(',', '.')) || 0,
              minStockLevel: parseInt(String(rawMinStock)) || 5 // Default min stock if missing
            });
          }

          // --- Build Inventory ---
          const stockVal = parseInt(String(rawStock));
          if (!isNaN(stockVal)) {
             inventoryMap.set(pid, {
                productId: pid,
                quantity: stockVal,
                lastUpdated: new Date().toISOString()
             });
          } else if (!inventoryMap.has(pid)) {
             // If no stock column, default to 0
             inventoryMap.set(pid, {
                productId: pid,
                quantity: 0,
                lastUpdated: new Date().toISOString()
             });
          }

          // --- Build Sale ---
          const qtd = parseInt(String(rawQtd));
          if (rawDate && !isNaN(qtd) && qtd > 0) {
            let saleDate: string;
            
            try {
                if (rawDate instanceof Date) {
                  saleDate = rawDate.toISOString();
                } else {
                  // Attempt to parse string dates
                  // Handle "DD/MM/YYYY" format common in Brazil
                  const dateStr = String(rawDate).trim();
                  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                      const [day, month, year] = dateStr.split('/');
                      saleDate = new Date(`${year}-${month}-${day}`).toISOString();
                  } else {
                      const parsed = new Date(dateStr);
                      saleDate = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
                  }
                }
            } catch (e) {
                saleDate = new Date().toISOString();
            }

            sales.push({
              id: `sale-${index}-${Math.random().toString(36).substr(2, 5)}`,
              productId: pid,
              quantity: qtd,
              total: (productsMap.get(pid)?.price || 0) * qtd,
              date: saleDate
            });
          }
        });

        if (productsMap.size === 0) {
            console.error("Colunas normalizadas encontradas na primeira linha:", firstRowKeys);
            throw new Error(`Nenhum produto válido encontrado. Colunas detectadas: ${firstRowKeys.join(', ')}. O sistema espera colunas como 'Código' e 'Produto' ou 'Descrição'.`);
        }

        const storeData: StoreData = {
          products: Array.from(productsMap.values()),
          inventory: Array.from(inventoryMap.values()),
          sales: sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };

        console.log("Importação concluída:", storeData);
        resolve(storeData);
      } catch (error: any) {
        console.error("Erro no processamento:", error);
        reject(new Error(error.message || "Erro desconhecido ao processar a planilha."));
      }
    };

    reader.onerror = () => reject(new Error("Erro de leitura do arquivo."));
    
    // START CHANGE: Use readAsText for CSVs to respect UTF-8
    if (isCSV) {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
    // END CHANGE
  });
};

export const generateTemplateCSV = () => {
  const headers = ['date', 'product_id', 'product_name', 'category', 'cost', 'price', 'quantity_sold', 'current_stock', 'min_stock'];
  const rows = [
    ['2023-10-01', 'P001', 'Camiseta Polo', 'Vestuário', '25.00', '60.00', '2', '50', '10'],
    ['2023-10-02', 'P002', 'Tênis Sport', 'Calçados', '80.00', '199.90', '1', '12', '5'],
    ['2023-10-02', 'P001', 'Camiseta Polo', 'Vestuário', '25.00', '60.00', '5', '45', '10'],
  ];
  
  // Add BOM for Excel UTF-8 compatibility
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "modelo_up_insightstore.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
