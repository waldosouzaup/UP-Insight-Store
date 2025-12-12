import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Clock, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import { getEnrichedSales } from '../services/mockSupabase';
import { StoreData } from '../types';

interface DashboardViewProps {
  data: StoreData;
  userName?: string;
}

// Color Palette
const COLORS = ['#49FFBD', '#FF4979', '#49C6FF', '#FFB849', '#BD49FF', '#94a3b8'];

// --- Components ---

const KPICard = ({ title, value, prevValue, type = 'currency', icon: Icon, accentColor }: any) => {
  let percentChange = 0;
  if (prevValue > 0) {
    percentChange = ((value - prevValue) / prevValue) * 100;
  } else if (value > 0 && prevValue === 0) {
      percentChange = 100; // Growth from zero
  }
  
  const isPositive = percentChange >= 0;
  const formattedValue = type === 'currency' 
    ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : value;

  return (
    <div className="rounded-xl shadow-lg border backdrop-blur-sm p-6 flex flex-col justify-between transition-transform hover:scale-[1.02]"
         style={{ 
           backgroundColor: 'rgba(255, 255, 255, 0.05)', 
           borderColor: 'rgba(255, 255, 255, 0.1)' 
         }}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
          <Icon className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        {prevValue !== undefined && (
             <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(percentChange).toFixed(1)}%
             </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{title}</p>
        <h3 className="text-2xl font-bold text-white">{formattedValue}</h3>
        <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
           {prevValue !== undefined ? 'vs. mês anterior' : 'Mês Atual'}
        </p>
      </div>
    </div>
  );
};

const DashboardView: React.FC<DashboardViewProps> = ({ data, userName }) => {
  // State for Custom Date Range in Trend Chart
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  const enrichedSales = useMemo(() => getEnrichedSales(data), [data]);

  // --- Data Analysis Logic ---

  // 1. Determine Current Context (Latest Month in Data)
  const contextData = useMemo(() => {
     if (enrichedSales.length === 0) return { currentMonth: [], prevMonth: [], latestDate: new Date() };

     const sortedSales = [...enrichedSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     const latestDate = new Date(sortedSales[0].date);
     
     const currentMonthStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
     const prevMonthStart = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
     const prevMonthEnd = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0, 23, 59, 59);

     const currentMonthSales = enrichedSales.filter(s => new Date(s.date) >= currentMonthStart);
     const prevMonthSales = enrichedSales.filter(s => {
         const d = new Date(s.date);
         return d >= prevMonthStart && d <= prevMonthEnd;
     });

     return { currentMonthSales, prevMonthSales, latestDate };
  }, [enrichedSales]);

  // Initialize Trend Date Range based on data
  useEffect(() => {
    if (enrichedSales.length > 0) {
      const endDateStr = contextData.latestDate.toISOString().split('T')[0];
      const startDateObj = new Date(contextData.latestDate);
      startDateObj.setDate(startDateObj.getDate() - 6); // Last 7 days
      setDateRange({ start: startDateObj.toISOString().split('T')[0], end: endDateStr });
    } else {
      const now = new Date();
      setDateRange({ 
          start: new Date(now.setDate(now.getDate() - 6)).toISOString().split('T')[0], 
          end: new Date().toISOString().split('T')[0] 
      });
    }
  }, [enrichedSales, contextData.latestDate]);

  // --- KPI Calculations (Current Month) ---
  const kpiStats = useMemo(() => {
      const curRev = contextData.currentMonthSales.reduce((acc, s) => acc + s.total, 0);
      const prevRev = contextData.prevMonthSales.reduce((acc, s) => acc + s.total, 0);

      const curTx = contextData.currentMonthSales.length;
      const prevTx = contextData.prevMonthSales.length;

      const curTicket = curTx > 0 ? curRev / curTx : 0;
      const prevTicket = prevTx > 0 ? prevRev / prevTx : 0;

      return { curRev, prevRev, curTx, prevTx, curTicket, prevTicket };
  }, [contextData]);

  // --- Charts Logic ---

  // 1. Trend Chart (Dynamic Range)
  const generateDateArray = (start: string, end: string) => {
    const arr = [];
    const dt = new Date(start);
    const endDt = new Date(end);
    if (dt > endDt) return [start]; 
    while (dt <= endDt) {
      arr.push(new Date(dt).toISOString().split('T')[0]);
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  };

  const revenueTrendData = useMemo(() => {
    const dates = (!dateRange.start || !dateRange.end) ? [] : generateDateArray(dateRange.start, dateRange.end);
    const salesMap: Record<string, number> = {};
    dates.forEach(d => salesMap[d] = 0);

    enrichedSales.forEach(s => {
      const dateStr = s.date.split('T')[0];
      if (salesMap.hasOwnProperty(dateStr)) {
        salesMap[dateStr] += s.total;
      }
    });

    return dates.map(dateKey => {
      const [year, month, day] = dateKey.split('-');
      return {
        date: `${day}/${month}`,
        revenue: salesMap[dateKey] || 0
      };
    });
  }, [dateRange, enrichedSales]);

  // 2. Category Distribution (Pie Chart) - All Time Data
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    enrichedSales.forEach(s => map[s.category] = (map[s.category] || 0) + s.total);
    return Object.keys(map).map(key => ({ name: key, value: map[key] }));
  }, [enrichedSales]);

  // 3. Sales by Day of Week (Bar Chart) - Current Month
  const dayOfWeekData = useMemo(() => {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const map = new Array(7).fill(0);
      
      contextData.currentMonthSales.forEach(s => {
          const d = new Date(s.date).getDay();
          map[d] += s.total;
      });

      return days.map((day, idx) => ({ name: day, revenue: map[idx] }));
  }, [contextData]);

  // 4. Sales by Hour (Area/Bar Chart) - Current Month
  const hourlyData = useMemo(() => {
      const map = new Array(24).fill(0);
      contextData.currentMonthSales.forEach(s => {
          const h = new Date(s.date).getHours();
          map[h] += 1; // Count transactions for staffing
      });
      
      // Filter only business hours usually relevant (e.g. 08:00 to 22:00) to avoid empty chart space
      const displayHours = [];
      for(let i=8; i<=22; i++) {
          displayHours.push({ hour: `${i}h`, count: map[i] });
      }
      return displayHours;
  }, [contextData]);

  // 5. Top Products by Revenue (Horizontal Bar) - Current Month
  const topProductsData = useMemo(() => {
      const map: Record<string, number> = {};
      contextData.currentMonthSales.forEach(s => {
          map[s.productName] = (map[s.productName] || 0) + s.total;
      });
      return Object.entries(map)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, val]) => ({ name, revenue: val }));
  }, [contextData]);


  // Handler for reset
  const handleResetDate = () => {
    if (enrichedSales.length > 0) {
     const endDateStr = contextData.latestDate.toISOString().split('T')[0];
     const startDateObj = new Date(contextData.latestDate);
     startDateObj.setDate(startDateObj.getDate() - 6);
     setDateRange({ start: startDateObj.toISOString().split('T')[0], end: endDateStr });
   }
 };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">
             Seja bem vindo, <span className="text-[#49FFBD]">{userName || 'Visitante'}</span>
          </h2>
          <p className="text-slate-400">
             Visão consolidada de {contextData.latestDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-xs px-3 py-1 rounded-full border border-[#49FFBD]/30 text-[#49FFBD] bg-[#49FFBD]/10">
          Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* 1. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Receita Mensal" 
          value={kpiStats.curRev} 
          prevValue={kpiStats.prevRev}
          icon={DollarSign}
          accentColor="#49FFBD"
        />
        <KPICard 
          title="Vendas Realizadas" 
          value={kpiStats.curTx} 
          prevValue={kpiStats.prevTx}
          type="number"
          icon={ShoppingBag}
          accentColor="#49C6FF"
        />
        <KPICard 
          title="Ticket Médio" 
          value={kpiStats.curTicket} 
          prevValue={kpiStats.prevTicket}
          icon={TrendingUp}
          accentColor="#BD49FF"
        />
         {/* Peak Metric Card (Proxy for Operational Efficiency) */}
        <div className="rounded-xl shadow-lg border backdrop-blur-sm p-6 flex flex-col justify-between transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFB84920' }}>
                    <Clock className="w-6 h-6" style={{ color: '#FFB849' }} />
                </div>
            </div>
            <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Horário de Pico</p>
                <h3 className="text-2xl font-bold text-white">
                    {hourlyData.length > 0 
                        ? hourlyData.reduce((prev, current) => (prev.count > current.count) ? prev : current).hour
                        : 'N/A'
                    }
                </h3>
                <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                   Baseado no fluxo mensal
                </p>
            </div>
        </div>
      </div>

      {/* Row 2: Trend & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 p-6 rounded-xl shadow-lg border backdrop-blur-sm"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
                <h3 className="text-lg font-semibold text-white mb-1">Evolução do Faturamento</h3>
                <p className="text-xs text-slate-400">Análise temporal da receita</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2 bg-black/20 p-1.5 rounded-lg border border-white/10">
                    <span className="text-xs text-slate-400 pl-1">De</span>
                    <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="bg-transparent text-white text-xs outline-none border-b border-white/20 focus:border-[#49FFBD] w-24 px-1" />
                </div>
                <div className="flex items-center space-x-2 bg-black/20 p-1.5 rounded-lg border border-white/10">
                    <span className="text-xs text-slate-400 pl-1">Até</span>
                    <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="bg-transparent text-white text-xs outline-none border-b border-white/20 focus:border-[#49FFBD] w-24 px-1" />
                </div>
                <button onClick={handleResetDate} className="p-1.5 rounded-lg bg-[#49FFBD]/10 text-[#49FFBD]"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#49FFBD" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#49FFBD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#002D39', borderRadius: '8px', border: '1px solid #49FFBD', color: '#fff' }}
                  labelStyle={{ color: '#49FFBD', fontWeight: 'bold' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Faturamento']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#49FFBD" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (Donut) */}
        <div className="p-6 rounded-xl shadow-lg border backdrop-blur-sm"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Composição da Receita</h3>
          <div className="h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#002D39', borderRadius: '8px', border: '1px solid #49FFBD', color: '#fff' }}
                  labelStyle={{ color: '#49FFBD', fontWeight: 'bold' }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-sm text-slate-400 font-medium">Por Categoria</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Operational Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week Performance */}
          <div className="p-6 rounded-xl shadow-lg border backdrop-blur-sm"
               style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <h3 className="text-lg font-semibold text-white mb-1">Performance por Dia da Semana</h3>
              <p className="text-xs text-slate-400 mb-4">Faturamento médio acumulado (Mês Atual)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayOfWeekData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{ backgroundColor: '#002D39', borderRadius: '8px', border: '1px solid #49FFBD', color: '#fff' }}
                            labelStyle={{ color: '#49FFBD', fontWeight: 'bold' }}
                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                        />
                        <Bar dataKey="revenue" fill="#49C6FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Hourly Traffic (Heatmap Proxy) */}
          <div className="p-6 rounded-xl shadow-lg border backdrop-blur-sm"
               style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <h3 className="text-lg font-semibold text-white mb-1">Horários de Maior Movimento</h3>
              <p className="text-xs text-slate-400 mb-4">Volume de transações por hora (Mês Atual)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="hour" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#002D39', borderRadius: '8px', border: '1px solid #49FFBD', color: '#fff' }}
                            labelStyle={{ color: '#49FFBD', fontWeight: 'bold' }}
                            formatter={(value: number) => [`${value} vendas`, 'Volume']}
                        />
                        <Area type="step" dataKey="count" stroke="#FFB849" fill="#FFB849" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Row 4: Top Products (Horizontal) */}
      <div className="p-6 rounded-xl shadow-lg border backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Top 5 Produtos em Receita</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(val) => `R$${val}`} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{fontSize: 11}} width={120} />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#002D39', borderRadius: '8px', border: '1px solid #49FFBD', color: '#fff' }}
                        labelStyle={{ color: '#49FFBD', fontWeight: 'bold' }}
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                    />
                    <Bar dataKey="revenue" fill="#BD49FF" radius={[0, 4, 4, 0]}>
                        {topProductsData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

    </div>
  );
};

export default DashboardView;