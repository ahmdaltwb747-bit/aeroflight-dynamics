import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildCsv, buildPdf, type ExportContext } from '@/lib/exportUtils';
import type { PerformanceResults } from '@/lib/performanceCalculations';
import type { EngineMode, InputValues } from './AircraftAnalyzer';
import type { UnitSystem } from '@/lib/units';

interface ExportButtonsProps {
  results: PerformanceResults;
  mode: EngineMode;
  inputs: InputValues;
  sys: UnitSystem;
}

export function ExportButtons({ results, mode, inputs, sys }: ExportButtonsProps) {
  const { toast } = useToast();
  const ctx: ExportContext = { results, mode, inputs, sys };

  const doCsv = () => {
    try {
      const csv = buildCsv(ctx);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aircraft-performance-${mode}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'CSV exported', description: 'The full results table was downloaded.' });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Could not generate the CSV file.' });
    }
  };

  const doPdf = () => {
    try {
      buildPdf(ctx).save(`aircraft-performance-${mode}.pdf`);
      toast({ title: 'PDF exported', description: 'The report was downloaded.' });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Could not generate the PDF report.' });
    }
  };

  return (
    <div className="aviation-card p-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-semibold text-foreground">Export Results</p>
        <p className="text-xs text-muted-foreground">
          Full report — inputs, key results and both tables — in your current unit system.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={doCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-semibold text-foreground"
        >
          <Download className="w-4 h-4" /> CSV
        </button>
        <button
          onClick={doPdf}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-semibold text-foreground"
        >
          <FileText className="w-4 h-4" /> PDF
        </button>
      </div>
    </div>
  );
}
