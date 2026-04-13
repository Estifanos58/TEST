import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getFilenameFromDisposition = (contentDisposition) => {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || null;
};

export function DashboardCsvDownloadButton({
  endpoint,
  label = 'Download CSV',
  loadingLabel = 'Preparing CSV...',
  filenamePrefix = 'dashboard-export',
  className = ''
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You need to login first.');
      return;
    }

    setDownloading(true);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to download CSV';
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.message || errorMessage;
        } catch {
          // Ignore JSON parse failures and use default error message.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const suggestedFilename = getFilenameFromDisposition(
        response.headers.get('Content-Disposition')
      );
      const fallbackFilename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
      const filename = suggestedFilename || fallbackFilename;

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(error.message || 'Could not download CSV');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`px-4 py-2 bg-white border rounded-xl flex items-center gap-2 hover:bg-gray-50 transition disabled:opacity-50 ${className}`.trim()}
    >
      {downloading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {downloading ? loadingLabel : label}
    </button>
  );
}
