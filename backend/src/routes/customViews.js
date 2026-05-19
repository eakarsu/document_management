// DMS Custom Views (4 endpoints): document-tree, activity-timeline, bulk-upload, access-control
// Drop-in router; mounted at /api/custom-views from setupRoutes.ts
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// ---------- multer storage (auto-folder by file type) ----------
const UPLOAD_ROOT = path.join(__dirname, '../../uploads/custom-views');
function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }); } catch {} }
ensureDir(UPLOAD_ROOT);

function folderForFile(filename) {
  const ext = (path.extname(filename || '').toLowerCase().replace('.', '') || 'other');
  if (['pdf'].includes(ext)) return 'pdfs';
  if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) return 'documents';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheets';
  if (['ppt', 'pptx'].includes(ext)) return 'presentations';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'images';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'videos';
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return 'archives';
  return 'other';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = folderForFile(file.originalname);
    const dir = path.join(UPLOAD_ROOT, sub);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ---------- in-memory ACL store ----------
const aclStore = new Map(); // key: target id -> { users: [{user, view, edit, delete}] }

// ---------- helpers ----------
function listDirTree(absRoot, relRoot = '') {
  const abs = path.join(absRoot, relRoot);
  let stat;
  try { stat = fs.statSync(abs); } catch { return null; }
  const name = relRoot ? path.basename(relRoot) : path.basename(absRoot) || 'root';
  if (stat.isFile()) {
    return {
      name,
      path: relRoot || name,
      type: 'file',
      size: stat.size,
      modified: stat.mtime.toISOString(),
    };
  }
  let entries = [];
  try { entries = fs.readdirSync(abs); } catch { entries = []; }
  const children = entries
    .filter((e) => !e.startsWith('.'))
    .map((e) => listDirTree(absRoot, path.join(relRoot, e)))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  const totalFiles = children.reduce(
    (n, c) => n + (c.type === 'file' ? 1 : (c.totalFiles || 0)),
    0
  );
  const totalSize = children.reduce(
    (n, c) => n + (c.type === 'file' ? c.size : (c.totalSize || 0)),
    0
  );
  return {
    name,
    path: relRoot || '/',
    type: 'folder',
    modified: stat.mtime.toISOString(),
    children,
    totalFiles,
    totalSize,
  };
}

function seedDemoTreeIfEmpty() {
  const seedRoot = UPLOAD_ROOT;
  ensureDir(seedRoot);
  const has = (() => {
    try { return fs.readdirSync(seedRoot).length > 0; } catch { return false; }
  })();
  if (has) return;
  const folders = ['documents', 'pdfs', 'images', 'spreadsheets'];
  folders.forEach((f) => ensureDir(path.join(seedRoot, f)));
  fs.writeFileSync(path.join(seedRoot, 'documents', 'welcome.txt'), 'Welcome to the DMS document tree.');
  fs.writeFileSync(path.join(seedRoot, 'documents', 'policy.md'), '# Policy\n\nDemo policy doc.');
  fs.writeFileSync(path.join(seedRoot, 'pdfs', 'sample.pdf'), '%PDF-1.4 demo');
  fs.writeFileSync(path.join(seedRoot, 'spreadsheets', 'budget.csv'), 'a,b,c\n1,2,3\n4,5,6');
}

function genActivityTimeline() {
  const users = ['alice', 'bob', 'carol', 'dave'];
  const actions = ['upload', 'view', 'edit', 'delete'];
  const now = Date.now();
  const points = [];
  for (let day = 6; day >= 0; day--) {
    const date = new Date(now - day * 24 * 60 * 60 * 1000);
    const label = date.toISOString().slice(0, 10);
    const row = { date: label };
    actions.forEach((a) => {
      row[a] = Math.floor(2 + Math.random() * 10);
    });
    points.push(row);
  }
  const recent = [];
  for (let i = 0; i < 12; i++) {
    const ts = new Date(now - Math.floor(Math.random() * 6 * 24 * 60 * 60 * 1000));
    recent.push({
      id: `act_${i + 1}`,
      user: users[i % users.length],
      action: actions[i % actions.length],
      document: `doc-${1000 + i}.pdf`,
      timestamp: ts.toISOString(),
    });
  }
  recent.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return { series: points, actions, users, recent };
}

// ---------- endpoints ----------

// VIZ 1: Document Tree
router.get('/document-tree', (req, res) => {
  try {
    seedDemoTreeIfEmpty();
    const tree = listDirTree(UPLOAD_ROOT) || { name: 'root', path: '/', type: 'folder', children: [], totalFiles: 0, totalSize: 0 };
    res.json({ root: tree, generatedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'tree error' });
  }
});

// VIZ 2: Activity Timeline
router.get('/activity-timeline', (req, res) => {
  try {
    res.json(genActivityTimeline());
  } catch (e) {
    res.status(500).json({ error: e?.message || 'timeline error' });
  }
});

// NON-VIZ 1: Bulk Upload — drag-drop multi-file (multer) with auto folder placement
router.post('/bulk-upload', upload.array('files', 25), (req, res) => {
  try {
    const files = (req.files || []).map((f) => ({
      originalName: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
      folder: folderForFile(f.originalname),
      storedAs: path.basename(f.path),
      relativePath: path.relative(UPLOAD_ROOT, f.path),
    }));
    res.json({
      success: true,
      count: files.length,
      totalSize: files.reduce((n, f) => n + f.size, 0),
      files,
      uploadedAt: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'upload error' });
  }
});
// Allow GET probe for verification (returns shape only)
router.get('/bulk-upload', (req, res) => {
  res.json({
    info: 'POST multipart/form-data with field "files" to upload',
    folders: ['pdfs', 'documents', 'spreadsheets', 'presentations', 'images', 'videos', 'audio', 'archives', 'other'],
    maxFileSizeMB: 50,
  });
});

// NON-VIZ 2: Access Control Editor — GET returns matrix, POST saves
router.get('/access-control', (req, res) => {
  try {
    const targetId = String(req.query.targetId || 'default');
    const existing = aclStore.get(targetId);
    if (existing) return res.json({ targetId, ...existing });
    const users = ['alice', 'bob', 'carol', 'dave'];
    const matrix = users.map((u) => ({ user: u, view: u !== 'dave', edit: u === 'alice' || u === 'bob', delete: u === 'alice' }));
    res.json({
      targetId,
      target: { id: targetId, type: 'folder', name: 'documents' },
      users: matrix,
      updatedAt: null,
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'acl get error' });
  }
});
router.post('/access-control', express.json(), (req, res) => {
  try {
    const { targetId = 'default', target, users } = req.body || {};
    if (!Array.isArray(users)) return res.status(400).json({ error: 'users array required' });
    const payload = { target: target || { id: targetId, type: 'folder', name: 'documents' }, users, updatedAt: new Date().toISOString() };
    aclStore.set(String(targetId), payload);
    res.json({ success: true, targetId, ...payload });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'acl save error' });
  }
});

module.exports = router;
