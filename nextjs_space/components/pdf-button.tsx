'use client';

import { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface PdfButtonProps {
  startDate: string;
  endDate: string;
  disabled?: boolean;
}

export default function PdfButton({ startDate, endDate, disabled }: PdfButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error('Selecione um período');
      return;
    }

    setGenerating(true);
    toast.loading('Gerando relatório PDF...', { id: 'pdf' });

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error?.error ?? 'Erro ao gerar PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_glicemia_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Relatório gerado com sucesso!', { id: 'pdf' });
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao gerar relatório', { id: 'pdf' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating || disabled}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
    >
      {generating ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <FileText className="w-5 h-5" />
      )}
      {generating ? 'Gerando...' : 'Gerar Relatório PDF'}
    </button>
  );
}
