import { useState } from 'react';

export default function Home() {
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const resp = await fetch(`${api}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'web-'+Date.now(), jd, company_url: company, days })
      });
      const json = await resp.json();
      setResult(json);
    } catch (err) {
      setResult({ error: String(err) });
    } finally { setLoading(false); }
  }

  return (
    <main style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Trao — Interview Prep (demo)</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 800 }}>
        <label>Job description<textarea value={jd} onChange={e=>setJd(e.target.value)} rows={8} /></label>
        <label>Company URL<input value={company} onChange={e=>setCompany(e.target.value)} /></label>
        <label>Days<input type="number" value={days} onChange={e=>setDays(parseInt(e.target.value||'1'))} min={1} max={60} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Generating…' : 'Generate kit'}</button>
      </form>

      <section style={{ marginTop: 20 }}>
        <h2>Result</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result ? JSON.stringify(result, null, 2) : 'No result yet'}</pre>
      </section>
    </main>
  );
}
