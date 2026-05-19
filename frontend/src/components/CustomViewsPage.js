'use client';

import React from 'react';
import DocumentTree from './DocumentTree';
import ActivityTimeline from './ActivityTimeline';
import BulkUpload from './BulkUpload';
import AccessControlEditor from './AccessControlEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 16 }} data-testid="custom-views-page">
      <h1 style={{ marginTop: 0 }}>DMS Views</h1>
      <p style={{ color: '#555' }}>
        Document tree, activity timeline, bulk upload, and access control matrix for the document management system.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 16, marginTop: 16 }}>
        <DocumentTree />
        <ActivityTimeline />
        <BulkUpload />
        <AccessControlEditor />
      </div>
    </div>
  );
}
