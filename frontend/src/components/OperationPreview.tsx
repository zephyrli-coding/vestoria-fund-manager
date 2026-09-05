interface OperationPreviewProps {
  title: string;
  rows: { label: string; value: string }[];
  warning?: string;
}

export default function OperationPreview({ title, rows, warning }: OperationPreviewProps) {
  return (
    <section aria-label={title} aria-live="polite" style={{
      marginBottom: '20px', padding: '14px 16px', borderRadius: '10px',
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    }}>
      <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600 }}>{title}</p>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', fontSize: '13px' }}>
        {rows.map(({ label, value }) => (
          <div key={label} style={{ minWidth: 0 }}>
            <dt style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</dt>
            <dd style={{ margin: 0, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' }}>{value}</dd>
          </div>
        ))}
      </dl>
      {warning && <p role="note" style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--warning-color, #b45309)' }}>{warning}</p>}
    </section>
  );
}
