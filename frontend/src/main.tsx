import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { buildReportHref, readReportDate } from './urlState.js';

type ReportListItem = { id: number; reportDate: string; title: string; collectedAt: string };
type ReportItem = { id: number; source: string; headline: string; summary: string; link: string };
type ReportDetail = { id: number; reportDate: string; title: string; summary?: string; items: ReportItem[]; debug?: { model?: string; createdAt?: string } };
type BootstrapPayload = { reports: ReportListItem[]; selectedDate: string | null; detail: ReportDetail | null };

const API_BASE = '/api';
const THEME_KEY = 'ai-daily-theme';
const ADMIN_PATH = '/admin-9xk2m7q4';
const RSS_PATH = '/rss.xml';

function formatKst(dateStr?: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(d).replace(' ', ' ');
}

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);
  const c = useMemo(() => theme === 'dark'
    ? { bg:'#09090b', panel:'#18181b', card:'#0f0f14', text:'#e4e4e7', strong:'#fafafa', muted:'#a1a1aa', border:'rgba(255,255,255,.09)', primary:'#6366f1', glow:'rgba(99,102,241,.22)' }
    : { bg:'#f5f7fb', panel:'#fff', card:'#f1f5f9', text:'#334155', strong:'#0f172a', muted:'#64748b', border:'rgba(2,6,23,.12)', primary:'#4f46e5', glow:'rgba(79,70,229,.22)' }
  , [theme]);
  return { theme, setTheme, c };
}

function MainPage() {
  const { theme, setTheme, c } = useTheme();
  const [list, setList] = useState<ReportListItem[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  async function loadBootstrap() {
    setBootstrapping(true);
    try {
      const r = await fetch(`${API_BASE}/reports?bootstrap=1`);
      if (!r.ok) throw new Error('bootstrap_failed');
      const data = await r.json() as BootstrapPayload;
      const reports = Array.isArray(data?.reports) ? data.reports : [];
      const requestedDate = readReportDate(window.location.pathname, window.location.search);
      const hasRequestedDate = !!requestedDate && reports.some((report) => report.reportDate === requestedDate);
      const nextSelectedDate = hasRequestedDate ? requestedDate : data?.selectedDate || reports[0]?.reportDate || '';
      const nextDetail = hasRequestedDate
        ? (data?.detail?.reportDate === requestedDate ? data.detail : null)
        : (data?.detail || null);
      setList(reports);
      setSelectedDate(nextSelectedDate);
      setDetail(nextDetail);
      setDetailError('');
    } catch {
      setList([]);
      setSelectedDate('');
      setDetail(null);
      setDetailError('초기 리포트를 불러오지 못했습니다.');
    } finally {
      setBootstrapping(false);
    }
  }

  async function loadDetail(date: string) {
    if (!date) return;
    setDetailLoading(true);
    setDetailError('');
    try {
      const r = await fetch(`${API_BASE}/reports?date=${date}`);
      if (!r.ok) {
        setDetail(null);
        setDetailError(r.status === 404 ? '' : '리포트를 불러오지 못했습니다.');
        return;
      }
      setDetail(await r.json());
    } catch {
      setDetail(null);
      setDetailError('리포트를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }
  useEffect(() => { loadBootstrap(); }, []);
  useEffect(() => {
    if (bootstrapping || !selectedDate || selectedDate === detail?.reportDate) return;
    loadDetail(selectedDate);
  }, [bootstrapping, detail?.reportDate, selectedDate]);
  useEffect(() => {
    if (bootstrapping) return;
    const nextHref = buildReportHref(window.location.pathname, window.location.search, window.location.hash, selectedDate);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextHref !== currentHref) window.history.replaceState(null, '', nextHref);
  }, [bootstrapping, selectedDate]);

  const isSwitchingDetail = detailLoading && !!detail && selectedDate !== detail.reportDate;

  return (
    <div style={{ minHeight:'100vh', background:c.bg, color:c.text, fontFamily:'Inter,system-ui,sans-serif' }}>
      <style>{`html,body,#root{margin:0;padding:0;min-height:100%;background:${c.bg}}*{box-sizing:border-box}.wrap{max-width:1120px;margin:0 auto;padding:24px}.top{position:sticky;top:0;z-index:10;background:color-mix(in srgb, ${c.bg} 85%, transparent);backdrop-filter:blur(8px);border-bottom:1px solid ${c.border}}.panel{background:${c.panel};border:1px solid ${c.border};border-radius:14px;box-shadow:0 8px 26px rgba(0,0,0,.18)}.chip{font-size:12px;color:${c.muted};padding:4px 10px;border-radius:999px;background:${c.card}}.btn{padding:10px 12px;border-radius:10px;border:1px solid ${c.border};background:${c.panel};color:${c.strong};cursor:pointer}.select{padding:10px 12px;border-radius:10px;border:1px solid ${c.border};background:${c.bg};color:${c.strong}}.item{padding:14px 12px;border-radius:12px;background:${c.card};margin-bottom:10px}.item:hover{box-shadow:0 0 0 3px ${c.glow}}.skeleton{position:relative;overflow:hidden;background:${c.card}}.skeleton::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,${c.glow},transparent);animation:shimmer 1.2s infinite}.skeleton-line{height:14px;border-radius:999px;background:color-mix(in srgb, ${c.card} 65%, ${c.panel})}.skeleton-line + .skeleton-line{margin-top:10px}@keyframes shimmer{100%{transform:translateX(100%)}}a{color:${c.strong};text-decoration:underline;text-underline-offset:3px}`}</style>
      <div className="top"><div className="wrap" style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:14,paddingBottom:14}}><div><h1 style={{margin:'0 0 6px',color:c.strong}}>AI Daily Report</h1><div style={{color:c.muted,fontSize:14}}>일일 AI 뉴스 큐레이션 리포트</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><a className="btn" href={RSS_PATH} target="_blank" rel="noreferrer" aria-label="RSS feed" title="RSS feed" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:42,height:42,padding:0,textDecoration:'none'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="18" r="2.2" fill="currentColor" /><path d="M4 10.5a9.5 9.5 0 0 1 9.5 9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><path d="M4 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg></a><button className="btn" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label="Toggle theme" title="Toggle theme" style={{width:42,height:42,padding:0,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>{theme==='dark'?'☀️':'🌙'}</button></div></div></div>
      <main className="wrap">
        <section className="panel" style={{padding:12,marginBottom:14,display:'flex',gap:10,alignItems:'center'}}><span className="chip">날짜 선택</span><select className="select" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} disabled={bootstrapping || !list.length}>{list.length ? list.map(r=><option key={r.id} value={r.reportDate}>{r.reportDate}</option>) : <option value="">리포트 없음</option>}</select>{(bootstrapping || isSwitchingDetail) && <span className="chip">불러오는 중</span>}</section>
        <section className="panel" style={{padding:16}}>
          {bootstrapping || (detailLoading && !detail) ? (
            <div>
              <div className="skeleton" style={{height:28,width:180,borderRadius:10,marginBottom:18}} />
              {[0, 1, 2].map(index => <article key={index} className="item skeleton" style={{padding:16}}><div className="skeleton-line" style={{width:88,marginBottom:14}} /><div className="skeleton-line" style={{width:'72%',height:18,marginBottom:12}} /><div className="skeleton-line" style={{width:'100%'}} /><div className="skeleton-line" style={{width:'94%'}} /><div className="skeleton-line" style={{width:'66%'}} /></article>)}
            </div>
          ) : detail ? (
            <div style={{opacity:isSwitchingDetail ? 0.62 : 1, transition:'opacity .18s ease'}}>
              <h2 style={{marginTop:0,color:c.strong}}>{detail.reportDate}</h2>
              {detail.items.map(item=><article key={item.id} className="item"><div className="chip" style={{display:'inline-block',marginBottom:8}}>{item.source}</div><div style={{marginBottom:8}}><a href={item.link} target="_blank" rel="noreferrer" style={{fontWeight:600}}>{item.headline}</a></div><p style={{margin:0,whiteSpace:'pre-wrap'}}>{item.summary}</p></article>)}
              <div style={{fontSize:12,color:c.muted,marginTop:10,textAlign:'right'}}>Model: {detail.debug?.model || 'unknown'} | Created at {formatKst(detail.debug?.createdAt)}</div>
            </div>
          ) : (
            <p style={{color:c.muted}}>{detailError || '리포트가 없습니다.'}</p>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminPage() {
  const { theme, setTheme, c } = useTheme();
  const [initialized, setInitialized] = useState(false);
  const [checked, setChecked] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState('');

  async function status() {
    const r = await fetch(`${API_BASE}/admin-status`);
    const d = await r.json();
    setInitialized(!!d.initialized);
    setChecked(true);
  }
  useEffect(() => { status(); }, []);

  async function setup() {
    const r = await fetch(`${API_BASE}/admin-setup`, { method:'POST', credentials:'include', headers:{'content-type':'application/json','x-admin-setup-secret': setupSecret}, body: JSON.stringify({ adminId, password }) });
    const d = await r.json();
    if (!r.ok) return setMsg(d.message || 'setup failed');
    setAuthed(true); setMsg('setup 완료');
  }
  async function login() {
    const r = await fetch(`${API_BASE}/admin-login`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ adminId, password }) });
    const d = await r.json();
    if (!r.ok) return setMsg(d.message || 'login failed');
    setAuthed(true); setMsg('login 완료');
  }
  async function resetData() {
    const r = await fetch(`${API_BASE}/admin-reset-data`, { method:'POST', credentials:'include' });
    const d = await r.json(); setMsg(JSON.stringify(d, null, 2));
  }
  async function resetCache() {
    const r = await fetch(`${API_BASE}/admin-reset-cache`, { method:'POST', credentials:'include' });
    const d = await r.json(); setMsg(JSON.stringify(d, null, 2));
  }

  if (!checked) return <div style={{padding:24}}>Loading...</div>;

  return (
    <div style={{ minHeight:'100vh', background:c.bg, color:c.text, fontFamily:'Inter,system-ui,sans-serif', padding:24 }}>
      <style>{`html,body,#root{margin:0;padding:0;min-height:100%;background:${c.bg}} input{padding:12px 14px;border-radius:10px;border:1px solid ${c.border};background:${c.card};color:${c.strong};font-size:14px} button{cursor:pointer}`}</style>
      <div style={{maxWidth:760, margin:'0 auto', display:'grid', gap:16}}>
        <section style={{background:c.panel, border:`1px solid ${c.border}`, borderRadius:14, padding:20, boxShadow:'0 8px 26px rgba(0,0,0,.18)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <h2 style={{margin:0,color:c.strong,letterSpacing:'-.02em'}}>Admin Tool</h2>
            <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} style={{width:40,height:40,borderRadius:8,border:`1px solid ${c.border}`,background:c.card,color:c.strong}}>{theme==='dark'?'☀️':'🌙'}</button>
          </div>
          <p style={{margin:'0 0 14px', color:c.muted, fontSize:14}}>{!initialized ? '최초 관리자 계정을 생성하세요.' : '관리자 로그인 후 관리 작업을 실행하세요.'}</p>

          {!authed ? (
            <div style={{display:'grid',gap:10,maxWidth:360}}>
              {!initialized && (
                <input type='password' placeholder='setup secret' value={setupSecret} onChange={e=>setSetupSecret(e.target.value)} />
              )}
              <input placeholder='admin id' value={adminId} onChange={e=>setAdminId(e.target.value)} />
              <input type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} />
              {!initialized
                ? <button onClick={setup} style={{padding:'12px 14px',borderRadius:10,border:'none',background:c.primary,color:'#fff',fontWeight:600}}>계정 생성</button>
                : <button onClick={login} style={{padding:'12px 14px',borderRadius:10,border:'none',background:c.primary,color:'#fff',fontWeight:600}}>로그인</button>}
            </div>
          ) : (
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button onClick={resetData} style={{padding:'11px 14px',borderRadius:10,border:`1px solid ${c.border}`,background:c.card,color:c.strong}}>데이터 reset(오늘 재생성)</button>
              <button onClick={resetCache} style={{padding:'11px 14px',borderRadius:10,border:`1px solid ${c.border}`,background:c.card,color:c.strong}}>캐시 reset</button>
              <button onClick={()=>{setAuthed(false); setMsg('로그아웃됨');}} style={{padding:'11px 14px',borderRadius:10,border:`1px solid ${c.border}`,background:'#7f1d1d',color:'#fee2e2'}}>로그아웃</button>
            </div>
          )}
        </section>

        <section style={{background:c.panel, border:`1px solid ${c.border}`, borderRadius:14, padding:16}}>
          <div style={{fontSize:12, color:c.muted, marginBottom:8}}>응답 로그</div>
          <pre style={{margin:0,whiteSpace:'pre-wrap',fontSize:12,color:c.muted,background:c.card,padding:12,borderRadius:10}}>{msg || '대기 중'}</pre>
        </section>
      </div>
    </div>
  );
}


const isAdmin = window.location.pathname === ADMIN_PATH;
createRoot(document.getElementById('root')!).render(isAdmin ? <AdminPage /> : <MainPage />);
