import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { siteSchema, orientation, ratio, type Media } from './schema';
import rawContent from 'virtual:media-catalog';
import './style.css';

const content = siteSchema.parse(rawContent);
const { site, labels: l } = content;
const base = import.meta.env.BASE_URL;
const asset = (path: string) => `${base}${path.split('/').map(encodeURIComponent).join('/')}`;
const mediaUrl = (media: Media) => `${base}medias/${media.id}/`;
const downloadUrl = (media: Media) => media.parts.length ? `${base}downloads/${media.id}.zip` : asset(media.file);
const normalise = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const date = (value: string) => new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(`${value}T00:00:00Z`));

function Icon({name}: {name: 'search' | 'download' | 'share' | 'close' | 'play' | 'back' | 'info'}) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.5 10.5 7-4m-7 7 7 4"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    play: <path d="m8 4 13 8-13 8z"/>,
    back: <path d="m10 5-7 7 7 7M3 12h18"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Header() {
  return <header className="header"><a className="brand" href={base}><img src={asset('favicon.svg')} alt=""/><span>{site.name}</span></a><nav aria-label={l.library}><a href={`${base}#mediatheque`}>{l.library}</a><a href={`${base}#themes`}>{l.categories}</a><a href={`${base}#a-propos`}>{l.about}</a><a href={site.authorMessage.profileUrl} target="_blank" rel="noopener noreferrer">{site.authorMessage.profileLabel}</a></nav><span className="tricolour" aria-hidden="true"/></header>;
}

function AuthorMessage() {
  const message = site.authorMessage;
  return <section className="author-message" aria-labelledby="author-message-title">
    <h2 id="author-message-title">{message.title}</h2>
    {message.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    <a className="author-signature" href={message.profileUrl} target="_blank" rel="noopener noreferrer">{message.signature}<span aria-hidden="true"> ↗ X</span></a>
  </section>;
}

function ShareDialog({media, onClose}: {media: Media; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const url = new URL(mediaUrl(media), window.location.origin).href;
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; focused?.focus(); };
  }, []);
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus(l.copied); }
    catch { input.current?.focus(); input.current?.select(); setStatus(l.copyFailed); }
  }
  return <dialog ref={dialog} className="share-dialog" onCancel={onClose} onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }} aria-labelledby="share-title">
    <button className="icon-button close" aria-label={l.close} onClick={onClose}><Icon name="close"/></button>
    <span className="eyebrow">{l.share}</span><h2 id="share-title">{l.shareTitle}</h2><p className="dialog-media-title">{media.title}</p>
    <p>{content.shareMessage}</p><label htmlFor="share-link">{l.share}</label>
    <div className="copy-field"><input ref={input} id="share-link" value={url} readOnly onFocus={event => event.target.select()}/><button className="button navy" onClick={copy}>{l.copyLink}</button></div>
    <p className="copy-status" role="status">{status}</p>
    <div className="dialog-actions"><a className="button red" href={downloadUrl(media)} download><Icon name="download"/>{media.parts.length ? l.downloadGroup : l.download}</a><a className="button outline" href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(media.title)}`} target="_blank" rel="noopener noreferrer">{l.shareOnX}</a></div>
  </dialog>;
}

function MediaCard({media, onShare}: {media: Media; onShare: (media: Media) => void}) {
  return <article className="media-card">
    <a className="preview" href={mediaUrl(media)} aria-label={`${l.view} : ${media.title}`}>
      <img src={asset(media.thumbnail)} alt={media.alt} loading="lazy" decoding="async" width={media.width} height={media.height}/>
      <span className={`type-badge ${media.type}`}>{l[media.type]}</span><span className="ratio-badge">{ratio(media)}</span>
      {media.type === 'video' && <span className="play"><Icon name="play"/></span>}
    </a>
    <div className="card-content"><div className="card-meta"><span>{content.categories.find(item => item.id === media.category)?.label}</span>{media.demo && <span className="demo-badge">{l.example}</span>}{media.featured && <span className="featured">{l.featured}</span>}</div>
      <h3><a href={mediaUrl(media)}>{media.title}</a></h3><time dateTime={media.date}>{date(media.date)}</time><span className="dimensions">{media.width} × {media.height} · {media.file.split('.').pop()?.toUpperCase()}{media.parts.length ? ` · ${media.parts.length + 1} ${l.groupFiles}` : ''}</span>
      <div className="card-actions"><a className="view-link" href={mediaUrl(media)}>{l.view}</a><a className="icon-button" href={downloadUrl(media)} download aria-label={`${media.parts.length ? l.downloadGroup : l.download} : ${media.title}`}><Icon name="download"/></a><button className="icon-button" onClick={() => onShare(media)} aria-label={`${l.share} : ${media.title}`}><Icon name="share"/></button></div>
    </div>
  </article>;
}

function Library({onShare}: {onShare: (media: Media) => void}) {
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get('q') || '');
  const requestedType = initial.get('type') || 'all';
  const requestedFormat = initial.get('format') || 'all';
  const requestedCategory = initial.get('category') || 'all';
  const requestedPage = Number(initial.get('page'));
  const [type, setType] = useState(['all', 'image', 'video', 'gif', 'audio'].includes(requestedType) ? requestedType : 'all');
  const [format, setFormat] = useState(['all', 'horizontal', 'square', 'vertical'].includes(requestedFormat) ? requestedFormat : 'all');
  const [category, setCategory] = useState(content.categories.some(item => item.id === requestedCategory) ? requestedCategory : 'all');
  const [page, setPage] = useState(Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1);
  const matches = useMemo(() => content.media.filter(media =>
    (type === 'all' || type === media.type) && (format === 'all' || format === orientation(media)) &&
    (category === 'all' || category === media.category) && normalise([media.title, media.description, ...media.tags].join(' ')).includes(normalise(query))), [query, type, format, category]);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type !== 'all') params.set('type', type);
    if (format !== 'all') params.set('format', format);
    if (category !== 'all') params.set('category', category);
    if (currentPage > 1) params.set('page', String(currentPage));
    const search = params.toString();
    window.history.replaceState(null, '', `${base}${search ? `?${search}` : ''}${window.location.hash}`);
  }, [query, type, format, category, currentPage]);
  const reset = () => { setQuery(''); setType('all'); setFormat('all'); setCategory('all'); setPage(1); };
  return <>
    <section className="hero"><div className="hero-inner"><span className="eyebrow">{site.eyebrow}</span><h1>{site.headline}</h1><p>{site.description}</p></div><div className="hero-mark" aria-hidden="true"><span>01</span><div className="tricolour"/></div></section>
    <main id="mediatheque" className="library">
      <AuthorMessage/>
      <div className="filter-area"><label className="search-field"><Icon name="search"/><span className="sr-only">{l.search}</span><input type="search" value={query} placeholder={l.search} onChange={event => {setQuery(event.target.value); setPage(1);}}/></label>
        <div className="filter-line"><div className="filter-group" role="group" aria-label={l.library}>{(['all', 'video', 'image', 'gif', 'audio'] as const).map(item => <button key={item} className={`chip ${type === item ? 'active' : ''}`} aria-pressed={type === item} onClick={() => {setType(item); setPage(1);}}>{l[item]}</button>)}</div>
          <div className="filter-group orientation" role="group" aria-label={l.allFormats}>{(['all', 'horizontal', 'square', 'vertical'] as const).map(item => <button key={item} className={`chip ${format === item ? 'active' : ''}`} aria-pressed={format === item} onClick={() => {setFormat(item); setPage(1);}}>{item === 'all' ? l.allFormats : l[item]}</button>)}</div></div>
        <div id="themes" className="category-line"><label><span className="sr-only">{l.categories}</span><select value={category} onChange={event => {setCategory(event.target.value); setPage(1);}}><option value="all">{l.allCategories}</option>{content.categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><span role="status">{matches.length} {matches.length === 1 ? l.result : l.results}</span></div>
      </div>
      {content.media.some(media => media.demo) && <p className="demo-notice"><Icon name="info"/>{l.demoNotice}</p>}
      <div className="section-title"><h2>{l.latest}</h2><span/></div>
      {matches.length ? <div className="media-grid">{matches.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(media => <MediaCard key={media.id} media={media} onShare={onShare}/>)}</div> : <div className="empty"><h3>{l.noResults}</h3><button className="button navy" onClick={reset}>{l.reset}</button></div>}
      <div className="catalog-footer"><p><Icon name="info"/>{l.formatPreserved}</p>{totalPages > 1 && <nav className="pagination" aria-label={l.page}><button className="chip" disabled={currentPage === 1} onClick={() => {setPage(currentPage - 1); document.getElementById('mediatheque')?.scrollIntoView();}}>{l.previous}</button><span>{l.page} {currentPage} / {totalPages}</span><button className="chip" disabled={currentPage === totalPages} onClick={() => {setPage(currentPage + 1); document.getElementById('mediatheque')?.scrollIntoView();}}>{l.next}</button></nav>}</div>
      <section id="a-propos" className="about"><span className="eyebrow">{l.about}</span><h2>{site.name}</h2><p>{site.about}</p></section>
    </main>
  </>;
}

function Detail({media, onShare}: {media: Media; onShare: (media: Media) => void}) {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState(false);
  const items = [media, ...media.parts];
  const current = items[selected];
  useEffect(() => {document.title = `${media.title} — ${site.name}`;}, [media]);
  return <main className="detail"><a className="back-link" href={base}><Icon name="back"/>{l.back}</a><div className="detail-layout"><div className="detail-player">
    {current.type === 'video' ? <video key={current.file} controls playsInline preload="metadata" poster={asset(current.thumbnail)} width={current.width} height={current.height} src={asset(current.file)} onError={() => setFailed(true)}>{l.unsupported}</video> : current.type === 'audio' ? <div className="audio-player"><img src={asset(current.thumbnail)} alt={current.alt}/><audio key={current.file} controls preload="metadata" src={asset(current.file)} onError={() => setFailed(true)}>{l.unsupported}</audio></div> : <img src={asset(current.file)} alt={current.alt} width={current.width} height={current.height} onError={() => setFailed(true)}/>}
  </div><article className="detail-info"><span className="eyebrow">{content.categories.find(item => item.id === media.category)?.label}</span><h1>{media.title}</h1><div className="detail-badges"><span className="chip">{l[current.type]}</span><span className="chip">{ratio(current)}</span><span className="chip">{current.width} × {current.height}</span>{media.demo && <span className="demo-badge">{l.example}</span>}</div><time dateTime={media.date}>{date(media.date)}</time><p>{media.description}</p>
    {media.parts.length > 0 && <section className="parts"><h2>{l.part}</h2><div className="part-buttons">{items.map((item, index) => <button key={item.file} className={`chip ${selected === index ? 'active' : ''}`} aria-pressed={selected === index} onClick={() => {setSelected(index); setFailed(false);}}>{index + 1}</button>)}</div><p role="status">{selected + 1} / {items.length} · {current.title}</p></section>}
    {failed && <p role="alert">{l.unsupported}</p>}
    <div className="detail-actions">{media.parts.length > 0 && <a className="button red" href={downloadUrl(media)} download><Icon name="download"/>{l.downloadGroup}</a>}<a className={`button ${media.parts.length ? 'outline' : 'red'}`} href={asset(current.file)} download><Icon name="download"/>{l.download}{media.parts.length ? ` (${selected + 1})` : ''}</a><button className="button outline" onClick={() => onShare(media)}><Icon name="share"/>{l.share}</button></div>
    <p className="preserved"><Icon name="info"/>{l.formatPreserved}</p>
    {media.variants.length > 0 && <section><h2>{l.variants}</h2>{media.variants.map(variant => <a className="variant" key={variant.file} href={asset(variant.file)} download><Icon name="download"/>{variant.label} <span>{ratio(variant)} · {variant.width} × {variant.height}</span></a>)}</section>}
    {media.source && <a href={media.source} target="_blank" rel="noopener noreferrer">{l.source}</a>}
  </article></div></main>;
}

function App() {
  const [shared, setShared] = useState<Media | null>(null);
  const path = window.location.pathname.slice(base.length).replace(/\/+$/, '');
  const mediaId = path ? (path.startsWith('medias/') ? path.slice('medias/'.length) : path) : null;
  const media = content.media.find(item => item.id === mediaId);
  return <><a className="skip-link" href="#main">{l.library}</a><Header/><div id="main">{mediaId ? media ? <Detail media={media} onShare={setShared}/> : <main className="empty"><h1>{l.notFound}</h1><a href={base}>{l.back}</a></main> : <Library onShare={setShared}/>}</div><footer className="footer"><a href={base}>{site.name}</a><span className="tricolour" aria-hidden="true"/><p>{site.footer}</p></footer>{shared && <ShareDialog key={shared.id} media={shared} onClose={() => setShared(null)}/>}</>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
