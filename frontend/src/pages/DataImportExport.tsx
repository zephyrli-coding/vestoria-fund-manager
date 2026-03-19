import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Download, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { useFundStore } from '@/stores/fund';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export default function DataImportExport() {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('Vestoria - 数据导入导出');
  const fundId = parseInt(id || '0');
  const { currentFund } = useFundStore();
  
  const [importContent, setImportContent] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export operations
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/funds/${fundId}/operations/export`);
      if (!response.ok) throw new Error('Export failed');
      
      const content = await response.text();
      
      // Create download
      const blob = new Blob([content], { type: 'application/jsonl' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fund_${fundId}_operations.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败: ' + (error as Error).message);
    }
  };

  // Import operations
  const handleImport = async () => {
    if (!importContent.trim()) {
      alert('请输入要导入的 JSONL 内容');
      return;
    }

    setLoading(true);
    setImportResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/funds/${fundId}/operations/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: importContent,
          mode: 'append'
        })
      });

      const result = await response.json();
      
      if (result.code === 0) {
        setImportResult(result.data);
      } else {
        alert('导入失败: ' + result.message);
      }
    } catch (error) {
      alert('导入失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
          数据导入导出
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          {currentFund?.name ? `基金: ${currentFund.name}` : '选择基金进行操作'}
        </p>
      </div>

      {/* Export Section */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Download size={24} color="var(--primary-color)" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>导出操作历史</h2>
        </div>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
          将当前基金的所有操作记录导出为 JSONL 格式。每行一个 JSON 对象，按时间顺序排列。
          <br />
          导出的文件可用于备份或在其他基金中重新执行。
        </p>

        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--primary-color)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <FileJson size={18} />
          导出 JSONL
        </button>
      </div>

      {/* Import Section */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Upload size={24} color="#22c55e" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>导入操作历史</h2>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
          从 JSONL 文件导入操作记录。系统将按顺序执行每个操作。
          <br />
          <strong>支持的操作类型：</strong>add_investor, invest, redeem, transfer, update_nav
        </p>

        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".jsonl,.json,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px dashed var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginRight: '12px'
            }}
          >
            📁 选择文件
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            或直接在下方粘贴内容
          </span>
        </div>

        {/* Text Area */}
        <textarea
          value={importContent}
          onChange={(e) => setImportContent(e.target.value)}
          placeholder={`示例格式：
{"operation_type": "add_investor", "operation_date": "2024-03-01", "investor_name": "张三"}
{"operation_type": "invest", "operation_date": "2024-03-01", "investor_name": "张三", "amount": 10000}
{"operation_type": "update_nav", "operation_date": "2024-03-02", "amount": 50000}`}
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            fontSize: '13px',
            resize: 'vertical',
            marginBottom: '20px'
          }}
        />

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            background: '#22c55e',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '导入中...' : <><Upload size={18} /> 执行导入</>}
        </button>

        {/* Import Result */}
        {importResult && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '10px',
            background: importResult.failed > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${importResult.failed > 0 ? 'var(--danger-color)' : '#22c55e'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              {importResult.failed > 0 ? (
                <AlertCircle size={20} color="var(--danger-color)" />
              ) : (
                <CheckCircle size={20} color="#22c55e" />
              )}
              <span style={{ fontWeight: 600 }}>
                导入完成: {importResult.success}/{importResult.total} 成功
              </span>
            </div>
            
            {importResult.errors.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ color: 'var(--danger-color)', fontWeight: 600, marginBottom: '8px' }}>
                  错误详情:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {importResult.errors.map((error: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        borderRadius: '10px',
        background: 'var(--bg-secondary)',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        <strong>操作类型说明：</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li><code>add_investor</code> - 添加投资者 (investor_name)</li>
          <li><code>invest</code> - 申购 (investor_name, amount)</li>
          <li><code>redeem</code> - 赎回 (investor_name, amount, amount_type)</li>
          <li><code>transfer</code> - 转账 (from_investor, to_investor, amount)</li>
          <li><code>update_nav</code> - 更新净值 (amount 作为总资产)</li>
        </ul>
      </div>
    </div>
  );
}
