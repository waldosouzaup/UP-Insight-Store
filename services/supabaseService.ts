import { supabase } from './supabaseClient';
import { StoreData, Product, InventoryItem, Sale } from '../types';

// --- USER MANAGEMENT ---

export const updateUserProfile = async (updates: { fullName?: string; phone?: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.fullName,
      phone: updates.phone,
    }
  });

  if (error) throw error;
  return data;
};

export const updateUserCredentials = async (updates: { email?: string; password?: string }) => {
  const attributes: any = {};
  if (updates.email) attributes.email = updates.email;
  if (updates.password) attributes.password = updates.password;

  const { data, error } = await supabase.auth.updateUser(attributes);

  if (error) throw error;
  return data;
};

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
  // Note: IDs will contain the user prefix (e.g., "user123_prodABC"), which is fine for internal linking
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

export const uploadStoreDataToDB = async (data: StoreData, mode: 'append' | 'replace' = 'append') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const userId = user.id;

  // If mode is 'replace', delete all existing data for this user first
  if (mode === 'replace') {
    // Delete in order to respect foreign keys (Children first)
    const { error: delSales } = await supabase.from('sales').delete().eq('user_id', userId);
    if (delSales) throw new Error(`Erro ao limpar vendas: ${delSales.message}`);

    const { error: delInv } = await supabase.from('inventory').delete().eq('user_id', userId);
    if (delInv) throw new Error(`Erro ao limpar estoque: ${delInv.message}`);

    const { error: delProd } = await supabase.from('products').delete().eq('user_id', userId);
    if (delProd) throw new Error(`Erro ao limpar produtos: ${delProd.message}`);
  }

  // HELPER: Namespace IDs to ensure uniqueness per user in the shared DB
  // This prevents "Row-level security policy violation" when upserting IDs 
  // that might exist for other users.
  const makeUniqueId = (rawId: string) => `${userId}_${rawId}`;

  // 1. Prepare Products
  // Upsert allows updating existing products if ID matches
  const productsPayload = data.products.map(p => ({
    id: makeUniqueId(p.id), // Prefix ID
    user_id: userId,
    name: p.name,
    category: p.category,
    cost: p.cost,
    price: p.price,
    min_stock_level: p.minStockLevel
  }));

  const { error: prodError } = await supabase
    .from('products')
    .upsert(productsPayload, { onConflict: 'id' }); 
  
  if (prodError) throw new Error(`Erro ao salvar produtos: ${prodError.message}`);

  // 2. Prepare Inventory
  const inventoryPayload = data.inventory.map(i => ({
    user_id: userId,
    product_id: makeUniqueId(i.productId), // Use prefixed ID
    quantity: i.quantity,
    last_updated: new Date().toISOString()
  }));

  const { error: invError } = await supabase
    .from('inventory')
    .upsert(inventoryPayload, { onConflict: 'user_id,product_id' });

  if (invError) throw new Error(`Erro ao salvar estoque: ${invError.message}`);

  // 3. Prepare Sales
  const salesPayload = data.sales.map(s => ({
    user_id: userId,
    product_id: makeUniqueId(s.productId), // Use prefixed ID
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