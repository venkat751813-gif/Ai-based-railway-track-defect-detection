import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { acknowledged, limit } = req.query;
      let q = supabase.from('alerts').select('*').order('created_at', { ascending: false });
      if (acknowledged !== undefined) q = q.eq('acknowledged', acknowledged === 'true');
      if (limit) q = q.limit(Number(limit));
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('alerts').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase.from('alerts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('alerts error:', err);
    res.status(500).json({ error: err.message });
  }
}
