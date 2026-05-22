'use client';

import React, { useEffect, useState } from 'react';

const TARGETS = [
  { id: 'folder:documents', type: 'folder', name: 'documents' },
  { id: 'folder:pdfs', type: 'folder', name: 'pdfs' },
  { id: 'folder:images', type: 'folder', name: 'images' },
  { id: 'doc:welcome.txt', type: 'document', name: 'welcome.txt' },
  { id: 'doc:policy.md', type: 'document', name: 'policy.md' },
];

export default function AccessControlEditor() {
  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(null);

  function load(tid) {
    setSaved(null);
    setErr(null);
    fetch(`/api/custom-views/access-control?targetId=${encodeURIComponent(tid)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setErr(String(e)));
  }

  useEffect(() => { load(targetId); }, [targetId]);

  function toggle(idx, perm) {
    setData((d) => {
      const next = { ...d, users: d.users.map((u, i) => i === idx ? { ...u, [perm]: !u[perm] } : u) };
      return next;
    });
  }

  function save() {
    if (!data) return;
    setErr(null);
    setSaved(null);
    fetch('/api/custom-views/access-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId,
        target: TARGETS.find((t) => t.id === targetId),
        users: data.users,
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.error) setErr(d.error); else setSaved(d.updatedAt || new Date().toISOString()); })
      .catch((e) => setErr(String(e)));
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Access Control Editor</h3>
      <div style={{ marginBottom: 10 }}>
        <label>Target: </label>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          {TARGETS.map((t) => (
            <option key={t.id} value={t.id}>{t.type}: {t.name}</option>
          ))}
        </select>
      </div>
      {err && <div style={{ color: 'red' }}>{err}</div>}
      {!data && !err && <div>Loading...</div>}
      {data && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #ddd' }}>User</th>
                <th style={{ padding: 6, borderBottom: '1px solid #ddd' }}>View</th>
                <th style={{ padding: 6, borderBottom: '1px solid #ddd' }}>Edit</th>
                <th style={{ padding: 6, borderBottom: '1px solid #ddd' }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {(data.users || []).map((u, i) => (
                <tr key={u.user}>
                  <td style={{ padding: 6, borderBottom: '1px solid #f3f3f3' }}>{u.user}</td>
                  {['view', 'edit', 'delete'].map((p) => (
                    <td key={p} style={{ textAlign: 'center', padding: 6, borderBottom: '1px solid #f3f3f3' }}>
                      <input type="checkbox" checked={!!u[p]} onChange={() => toggle(i, p)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={save} style={{ padding: '6px 14px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 4 }}>Save Permissions</button>
            {saved && <span style={{ color: '#2e7d32' }}>Saved at {new Date(saved).toLocaleString()}</span>}
          </div>
        </>
      )}
    </div>
  );
}
