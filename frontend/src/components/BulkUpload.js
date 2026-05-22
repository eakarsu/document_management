'use client';

import React, { useRef, useState } from 'react';

function bytes(n) {
  if (n == null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BulkUpload() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  }
  function onChoose(e) {
    setFiles(Array.from(e.target.files || []));
  }
  function upload() {
    if (!files.length) return;
    setErr(null);
    setResult(null);
    setProgress(0);
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/custom-views/bulk-upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) setResult(data);
        else setErr(data.error || `HTTP ${xhr.status}`);
      } catch (e) {
        setErr('Bad response');
      }
    };
    xhr.onerror = () => setErr('Network error');
    xhr.send(fd);
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Bulk Upload</h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#1976d2' : '#bbb'}`,
          background: dragOver ? '#e3f2fd' : '#fafafa',
          padding: 24,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: 6,
        }}
      >
        Drag &amp; drop files here, or click to select
        <input ref={inputRef} type="file" multiple onChange={onChoose} style={{ display: 'none' }} />
      </div>

      {files.length > 0 && (
        <ul style={{ marginTop: 10 }}>
          {files.map((f, i) => (
            <li key={i}>{f.name} — {bytes(f.size)}</li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 10 }}>
        <button
          onClick={upload}
          disabled={!files.length}
          style={{ padding: '6px 14px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 4, cursor: files.length ? 'pointer' : 'not-allowed' }}
        >
          Upload {files.length || ''}
        </button>
      </div>

      {progress > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, background: '#43a047', height: 10 }} />
          </div>
          <small>{progress}%</small>
        </div>
      )}

      {err && <div style={{ color: 'red', marginTop: 8 }}>{err}</div>}
      {result && (
        <div style={{ marginTop: 10 }}>
          <strong>Uploaded {result.count} file(s), total {bytes(result.totalSize)}.</strong>
          <ul>
            {(result.files || []).map((f, i) => (
              <li key={i}>
                {f.originalName} → <em>{f.folder}/</em> ({bytes(f.size)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
