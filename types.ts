export interface Product {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  minStockLevel: number;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  lastUpdated: string;
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  total: number;
  date: string; // ISO String
}

export interface StoreData {
  products: Product[];
  inventory: InventoryItem[];
  sales: Sale[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INSIGHTS = 'INSIGHTS',
  INVENTORY = 'INVENTORY',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}