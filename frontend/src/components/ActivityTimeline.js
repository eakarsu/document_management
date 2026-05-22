'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const COLORS = { upload: '#2e7d32', view: '#1976d2', edit: '#ed6c02', delete: '#c62828' };

export default function ActivityTimeline() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/custom-views/activity-timeline')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Activity Timeline (per user / action)</h3>
      {err && <div style={{ color: 'red' }}>{err}</div>}
      {!data && !err && <div>Loading...</div>}
      {data && (
        <>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data.series || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {(data.actions || []).map((a) => (
                  <Line key={a} type="monotone" dataKey={a} stroke={COLORS[a] || '#666'} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <h4 style={{ marginBottom: 6 }}>Recent Actions</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee' }}>User</th>
                <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee' }}>Action</th>
                <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee' }}>Document</th>
                <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee' }}>When</th>
              </tr>
            </thead>
            <tbody>
              {(data.recent || []).map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 6, borderBottom: '1px solid #f3f3f3' }}>{r.user}</td>
                  <td style={{ padding: 6, borderBottom: '1px solid #f3f3f3', color: COLORS[r.action] || '#333', fontWeight: 600 }}>{r.action}</td>
                  <td style={{ padding: 6, borderBottom: '1px solid #f3f3f3' }}>{r.document}</td>
                  <td style={{ padding: 6, borderBottom: '1px solid #f3f3f3' }}>{new Date(r.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
