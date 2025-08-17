import { useState } from 'react';
import { exportService } from '../services/exportService';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const exportToCSV = async (type = 'cards') => {
    setIsExporting(true);
    setError(null);
    
    try {
      await exportService.exportToCSV(type);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async (type = 'cards') => {
    setIsExporting(true);
    setError(null);
    
    try {
      await exportService.exportToPDF(type);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToCSV,
    exportToPDF,
    isExporting,
    error
  };
}