import { supabase } from './supabaseClient';
import { StoreData, Product, InventoryItem, Sale } from '../types';

// --- FETCH DATA ---

export const fetchRealStoreData = async (): Promise<StoreData | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // 1. Fetch Products
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*');
  
  if (productsError) throw productsError;

  // 2. Fetch Inventory
  const { data: inventoryData, error: inventoryError } = await supabase
    .from('inventory')
    .select('*');

  if (inventoryError) throw inventoryError;

  // 3. Fetch Sales (Limit to last 1000 for performance in this demo)
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);

  if (salesError) throw salesError;

  // Map DB snake_case to App camelCase
  const products: Product[] = (productsData || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    cost: Number(p.cost),
    price: Number(p.price),
    minStockLevel: p.min_stock_level
  }));

  const inventory: InventoryItem[] = (inventoryData || []).map((i: any) => ({
    productId: i.product_id,
    quantity: i.quantity,
    lastUpdated: i.last_updated
  }));

  const sales: Sale[] = (salesData || []).map((s: any) => ({
    id: s.id,
    productId: s.product_id,
    quantity: s.quantity,
    total: Number(s.total),
    date: s.date
  }));

  if (products.length === 0) return null; // Indicator to show Upload View

  return { products, inventory, sales };
};

// --- UPLOAD DATA ---

export const uploadStoreDataToDB = async (data: StoreData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const userId = user.id;

  // 1. Prepare Products
  // Upsert allows updating existing products if ID matches
  const productsPayload = data.products.map(p => ({
    id: p.id,
    user_id: userId,
    name: p.name,
    category: p.category,
    cost: p.cost,
    price: p.price,
    min_stock_level: p.minStockLevel
  }));

  const { error: prodError } = await supabase
    .from('products')
    .upsert(productsPayload, { onConflict: 'id' }); // Assuming ID is unique per file
  
  if (prodError) throw new Error(`Erro ao salvar produtos: ${prodError.message}`);

  // 2. Prepare Inventory
  const inventoryPayload = data.inventory.map(i => ({
    user_id: userId,
    product_id: i.productId,
    quantity: i.quantity,
    last_updated: new Date().toISOString()
  }));

  // We delete existing inventory for these products to ensure clean state or use upsert
  const { error: invError } = await supabase
    .from('inventory')
    .upsert(inventoryPayload, { onConflict: 'user_id,product_id' });

  if (invError) throw new Error(`Erro ao salvar estoque: ${invError.message}`);

  // 3. Prepare Sales
  // For sales, we usually append. In this demo, we'll insert them.
  // Note: If re-uploading the same sheet, this might duplicate sales unless we track external_id.
  // For simplicity, we just insert.
  const salesPayload = data.sales.map(s => ({
    user_id: userId,
    product_id: s.productId,
    quantity: s.quantity,
    total: s.total,
    date: s.date
  }));

  const { error: salesError } = await supabase
    .from('sales')
    .insert(salesPayload);

  if (salesError) throw new Error(`Erro ao salvar vendas: ${salesError.message}`);

  return true;
};

// --- AUTH HELPERS ---

export const signOut = async () => {
    await supabase.auth.signOut();
};