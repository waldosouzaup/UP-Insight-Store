import { Product, InventoryItem, Sale, StoreData } from '../types';

/**
 * NOTE: In a production environment, this file would import `createClient` from '@supabase/supabase-js'
 * and fetch real data. For this demo, we simulate a robust dataset.
 */

const CATEGORIES = ['Eletrônicos', 'Vestuário', 'Casa', 'Beleza', 'Esportes'];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Smartphone X Pro', category: 'Eletrônicos', cost: 1200, price: 2500, minStockLevel: 10 },
  { id: 'p2', name: 'Fone Bluetooth Noise', category: 'Eletrônicos', cost: 150, price: 350, minStockLevel: 20 },
  { id: 'p3', name: 'Camiseta Básica Algodão', category: 'Vestuário', cost: 20, price: 60, minStockLevel: 50 },
  { id: 'p4', name: 'Calça Jeans Skinny', category: 'Vestuário', cost: 60, price: 180, minStockLevel: 30 },
  { id: 'p5', name: 'Tênis de Corrida Velox', category: 'Esportes', cost: 180, price: 450, minStockLevel: 15 },
  { id: 'p6', name: 'Kit Hidratante Facial', category: 'Beleza', cost: 40, price: 110, minStockLevel: 25 },
  { id: 'p7', name: 'Luminária de Mesa LED', category: 'Casa', cost: 80, price: 190, minStockLevel: 10 },
  { id: 'p8', name: 'Smart Watch Fit', category: 'Eletrônicos', cost: 300, price: 800, minStockLevel: 12 },
];

const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const now = new Date();
  const daysToGenerate = 30;

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random number of sales per day (5 to 20)
    const dailySalesCount = Math.floor(Math.random() * 15) + 5;

    for (let j = 0; j < dailySalesCount; j++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
      
      // Add some randomness to time of day (opening hours 09:00 - 20:00)
      const saleDate = new Date(date);
      saleDate.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));

      sales.push({
        id: `s-${i}-${j}`,
        productId: product.id,
        quantity,
        total: product.price * quantity,
        date: saleDate.toISOString(),
      });
    }
  }
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const generateInventory = (): InventoryItem[] => {
  return PRODUCTS.map(p => ({
    productId: p.id,
    quantity: Math.floor(Math.random() * (p.minStockLevel * 3)), // Random stock
    lastUpdated: new Date().toISOString()
  }));
};

// Singleton data store simulation
let cachedData: StoreData | null = null;

export const fetchStoreData = async (): Promise<StoreData> => {
  if (cachedData) return cachedData;

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const sales = generateSales();
  const inventory = generateInventory();

  cachedData = {
    products: PRODUCTS,
    sales,
    inventory
  };

  return cachedData;
};

// Helper for UI to get rich objects
export const getEnrichedSales = (data: StoreData) => {
  return data.sales.map(sale => {
    const product = data.products.find(p => p.id === sale.productId);
    return {
      ...sale,
      productName: product?.name || 'Desconhecido',
      category: product?.category || 'Geral',
      margin: product ? (product.price - product.cost) * sale.quantity : 0
    };
  });
};