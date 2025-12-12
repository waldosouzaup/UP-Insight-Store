import React from 'react';
import { AlertTriangle, PackageCheck, AlertCircle } from 'lucide-react';
import { StoreData } from '../types';

interface InventoryViewProps {
  data: StoreData;
}

const InventoryView: React.FC<InventoryViewProps> = ({ data }) => {
  // Combine product info with inventory levels
  const inventoryStatus = data.inventory.map(item => {
    const product = data.products.find(p => p.id === item.productId);
    if (!product) return null;

    const status = item.quantity <= product.minStockLevel 
      ? (item.quantity === 0 ? 'critical' : 'warning') 
      : 'ok';

    return {
      ...item,
      productName: product.name,
      category: product.category,
      minLevel: product.minStockLevel,
      status
    };
  }).filter(Boolean) as any[];

  const lowStockItems = inventoryStatus.filter(i => i.status !== 'ok');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Estoque & Alertas</h2>
        <p className="text-slate-400">Monitore níveis de reposição e saúde do inventário.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border shadow-sm flex items-center backdrop-blur-sm"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="p-3 bg-red-500/20 text-red-400 rounded-lg mr-4 border border-red-500/20">
                <AlertCircle className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-2xl font-bold text-white">
                    {inventoryStatus.filter(i => i.status === 'critical').length}
                </h4>
                <p className="text-sm text-slate-400">Produtos Esgotados</p>
            </div>
        </div>
        <div className="p-5 rounded-xl border shadow-sm flex items-center backdrop-blur-sm"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg mr-4 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-2xl font-bold text-white">
                    {inventoryStatus.filter(i => i.status === 'warning').length}
                </h4>
                <p className="text-sm text-slate-400">Abaixo do Mínimo</p>
            </div>
        </div>
        <div className="p-5 rounded-xl border shadow-sm flex items-center backdrop-blur-sm"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="p-3 bg-[#49FFBD]/20 text-[#49FFBD] rounded-lg mr-4 border border-[#49FFBD]/20">
                <PackageCheck className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-2xl font-bold text-white">
                    {inventoryStatus.filter(i => i.status === 'ok').length}
                </h4>
                <p className="text-sm text-slate-400">Estoque Saudável</p>
            </div>
        </div>
      </div>

      {/* Action Table: Low Stock */}
      <div className="rounded-xl shadow-lg border backdrop-blur-sm overflow-hidden"
           style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="px-6 py-4 border-b flex justify-between items-center"
             style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h3 className="text-lg font-semibold text-white">Alertas de Reposição</h3>
          <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-1 rounded-full font-medium animate-pulse">
             Ação Necessária
          </span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-slate-400">
                    <tr>
                        <th className="px-6 py-3 font-medium">Produto</th>
                        <th className="px-6 py-3 font-medium">Categoria</th>
                        <th className="px-6 py-3 font-medium text-center">Atual</th>
                        <th className="px-6 py-3 font-medium text-center">Mínimo</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {lowStockItems.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                Nenhum alerta de estoque no momento. Tudo certo! 🎉
                            </td>
                         </tr>
                    ) : (
                        lowStockItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3 font-medium text-white">{item.productName}</td>
                                <td className="px-6 py-3 text-slate-400">{item.category}</td>
                                <td className="px-6 py-3 text-center font-mono font-bold text-[#49FFBD]">{item.quantity}</td>
                                <td className="px-6 py-3 text-center text-slate-400">{item.minLevel}</td>
                                <td className="px-6 py-3">
                                    {item.status === 'critical' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/20">
                                            Esgotado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/20">
                                            Baixo
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;