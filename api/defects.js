import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { section_id, inspection_id, severity, status, limit } = req.query;
      let q = supabase.from('defects').select('*').order('detected_at', { ascending: false });
      if (section_id) q = q.eq('section_id', section_id);
      if (inspection_id) q = q.eq('inspection_id', inspection_id);
      if (severity) q = q.eq('severity', severity);
      if (status) q = q.eq('status', status);
      if (limit) q = q.limit(Number(limit));
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const rows = Array.isArray(req.body) ? req.body : [req.body];
      const { data, error } = await supabase.from('defects').insert(rows).select();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase.from('defects').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('defects error:', err);
    res.status(500).json({ error: err.message });
  }
}
