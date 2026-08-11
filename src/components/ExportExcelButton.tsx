import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel, type ExportSheet } from '@/lib/exportExcel';

interface Props {
  fileName: string;
  getSheets: () => ExportSheet[];
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function ExportExcelButton({
  fileName,
  getSheets,
  label = 'Exportar Excel',
  size = 'sm',
  className,
}: Props) {
  function handleClick() {
    try {
      const sheets = getSheets().filter(s => s.columns.length > 0);
      const hasData = sheets.some(s => s.rows.length > 0);
      if (!hasData) {
        toast.error('Não há dados para exportar nesta tela.');
        return;
      }
      exportToExcel({ fileName, sheets });
      toast.success('Planilha exportada com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível exportar a planilha.');
    }
  }

  return (
    <Button variant="outline" size={size} onClick={handleClick} className={className}>
      <FileSpreadsheet className="h-4 w-4 mr-1" /> {label}
    </Button>
  );
}
