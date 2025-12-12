import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertCircle, FileType, Database, Trash2, History } from 'lucide-react';
import { StoreData } from '../types';
import { parseSpreadsheet, generateTemplateCSV } from '../services/dataProcessor';
import { fetchStoreData } from '../services/mockSupabase'; // Keep for demo fallback if needed
import { uploadStoreDataToDB } from '../services/supabaseService';

interface UploadViewProps {
  onDataLoaded: (data: StoreData) => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  
  // State for upload mode: 'append' (default) or 'replace'
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError('');
    setStatusMsg('Lendo arquivo...');

    try {
      // Robust extension checking
      const fileName = file.name.toLowerCase();
      const isValid = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      
      if (!isValid) {
        throw new Error('Formato inválido. Por favor envie um arquivo .xlsx, .xls ou .csv');
      }

      console.log("Iniciando processamento do arquivo:", file.name);
      
      // 1. Parse Data locally
      const data = await parseSpreadsheet(file);
      
      const actionText = uploadMode === 'replace' ? 'Substituindo dados antigos...' : 'Adicionando ao histórico...';
      setStatusMsg(`Processando: ${actionText}`);
      
      // 2. Upload to Supabase with selected mode
      await uploadStoreDataToDB(data, uploadMode);

      setStatusMsg('Concluído!');
      // 3. Update App State
      onDataLoaded(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar arquivo. Verifique se o formato segue o modelo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [uploadMode]); // Add dependency on uploadMode

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // Reset value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const loadDemoData = async () => {
    setIsProcessing(true);
    setStatusMsg('Gerando dados de exemplo...');
    try {
        const data = await fetchStoreData();
        // Note: We don't upload demo data to the DB to avoid polluting the user's real account
        // We just pass it to the state.
        onDataLoaded(data);
    } catch (e) {
        setError("Erro ao carregar dados de demonstração");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" style={{ backgroundColor: '#002D39' }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">Importação de Dados</h2>
            <p className="text-slate-400">Carregue sua planilha para iniciar a análise</p>
        </div>

        <div className="rounded-2xl shadow-xl border overflow-hidden backdrop-blur-sm"
             style={{ 
               backgroundColor: 'rgba(255, 255, 255, 0.05)', 
               borderColor: 'rgba(255, 255, 255, 0.1)' 
             }}>
            
            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b border-white/10 bg-black/10">
                <button
                    onClick={() => setUploadMode('append')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        uploadMode === 'append'
                            ? 'bg-[#49FFBD]/20 border-[#49FFBD] text-white shadow-lg'
                            : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                >
                    <History className={`w-6 h-6 mb-2 ${uploadMode === 'append' ? 'text-[#49FFBD]' : 'text-slate-500'}`} />
                    <span className="font-semibold text-sm">Manter Histórico</span>
                    <span className="text-xs opacity-70 mt-1 text-center">Atualiza estoque e adiciona novas vendas.</span>
                </button>

                <button
                    onClick={() => setUploadMode('replace')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        uploadMode === 'replace'
                            ? 'bg-red-500/20 border-red-500 text-white shadow-lg'
                            : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                >
                    <Trash2 className={`w-6 h-6 mb-2 ${uploadMode === 'replace' ? 'text-red-400' : 'text-slate-500'}`} />
                    <span className="font-semibold text-sm">Substituir Tudo</span>
                    <span className="text-xs opacity-70 mt-1 text-center">Apaga dados antigos e insere apenas este arquivo.</span>
                </button>
            </div>

            {/* Header / Instructions */}
            <div className="px-6 py-4 border-b border-white/10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-[#49FFBD] uppercase tracking-wider mb-1">Modelo de Arquivo</h3>
                        <p className="text-xs text-slate-400">Formatos: .xlsx, .xls, .csv</p>
                    </div>
                    <button onClick={generateTemplateCSV} className="text-[#49FFBD] hover:underline font-medium inline-flex items-center text-sm bg-[#49FFBD]/10 px-3 py-1.5 rounded-lg border border-[#49FFBD]/20 transition-colors hover:bg-[#49FFBD]/20">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Modelo
                    </button>
                </div>
            </div>

            {/* Drop Zone */}
            <div className="p-8">
                <div 
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative overflow-hidden ${
                        isDragging 
                            ? 'border-[#49FFBD] bg-[#49FFBD]/10' 
                            : 'border-white/20 hover:border-[#49FFBD] hover:bg-white/5'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput')?.click()}
                >
                    <input 
                        id="fileInput" 
                        type="file" 
                        accept=".csv, .xlsx, .xls" 
                        className="hidden" 
                        onChange={handleFileSelect}
                    />
                    
                    {isProcessing ? (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-[#49FFBD]/30 border-t-[#49FFBD] rounded-full animate-spin mb-4"></div>
                            <p className="text-lg font-medium text-white">{statusMsg || 'Processando...'}</p>
                            <p className="text-sm text-slate-400">
                                {uploadMode === 'replace' ? 'Limpando banco de dados...' : 'Sincronizando...'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-[#49FFBD]/10 text-[#49FFBD] rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                {error ? <FileType className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                            </div>
                            <h4 className="text-lg font-medium text-white mb-1">
                                Clique ou arraste sua planilha
                            </h4>
                            <p className="text-sm text-slate-400 mb-6">
                                Modo Selecionado: <span className={uploadMode === 'replace' ? 'text-red-400 font-bold' : 'text-[#49FFBD] font-bold'}>
                                    {uploadMode === 'replace' ? 'Substituição Total' : 'Incremental'}
                                </span>
                            </p>
                            <span className="inline-flex items-center px-4 py-2 rounded-lg text-[#002D39] text-sm font-bold shadow-lg transition-transform hover:scale-105"
                                  style={{ backgroundColor: '#49FFBD' }}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Selecionar Arquivo
                            </span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-900/50 border border-red-800 text-red-200 rounded-lg flex items-start text-left animate-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold block mb-1">Erro na leitura:</span>
                            <span className="text-sm opacity-90">{error}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Demo Option */}
            <div className="p-4 border-t border-white/10 flex justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                <button 
                    onClick={loadDemoData}
                    className="text-sm text-slate-400 hover:text-[#49FFBD] underline transition-colors"
                >
                    Não tem dados agora? Usar versão de demonstração (Não salva no banco)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;