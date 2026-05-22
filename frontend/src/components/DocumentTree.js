'use client';

import React, { useEffect, useState } from 'react';

function formatBytes(n) {
  if (n == null) return '';
  const k = 1024;
  if (n < k) return `${n} B`;
  if (n < k * k) return `${(n / k).toFixed(1)} KB`;
  if (n < k * k * k) return `${(n / (k * k)).toFixed(1)} MB`;
  return `${(n / (k * k * k)).toFixed(1)} GB`;
}

function Node({ node, depth }) {
  const [open, setOpen] = useState(depth < 2);
  const indent = { paddingLeft: `${depth * 16}px` };
  if (node.type === 'file') {
    return (
      <div style={{ ...indent, padding: '4px 6px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee' }}>
        <span>{'\u{1F4C4} '} {node.name}</span>
        <span style={{ color: '#666', fontSize: 12 }}>
          {formatBytes(node.size)} {node.modified ? `· ${new Date(node.modified).toLocaleString()}` : ''}
        </span>
      </div>
    );
  }
  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        style={{ ...indent, padding: '6px', cursor: 'pointer', background: depth === 0 ? '#f5f5f5' : 'transparent', fontWeight: depth === 0 ? 600 : 500 }}
      >
        {open ? '▼' : '▶'} {'\u{1F4C1} '} {node.name}
        <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>
          {node.totalFiles != null ? `${node.totalFiles} files` : ''}
          {node.totalSize != null ? ` · ${formatBytes(node.totalSize)}` : ''}
        </span>
      </div>
      {open && (node.children || []).map((c, i) => (
        <Node key={`${c.path || c.name}-${i}`} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function DocumentTree() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/custom-views/document-tree')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Document Tree</h3>
      {err && <div style={{ color: 'red' }}>{err}</div>}
      {!data && !err && <div>Loading...</div>}
      {data?.root && <Node node={data.root} depth={0} />}
    </div>
  );
}
