import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

const TempleScene = lazy(() => import('./TempleScene'));
const spaces = [
  { name: 'Gerbang Sanmon', japanese: '山門', number: '01', theme: 'gate', note: 'Sebuah awal, sebuah jeda.', text: 'Tinggalkan riuh di belakang. Di bawah gerbang ini, langkah kecil menjadi awal perjalanan yang berbeda.' },
  { name: 'Taman lentera', japanese: '灯籠', number: '02', theme: 'garden', note: 'Ikuti cahaya yang lembut.', text: 'Di antara pinus dan cahaya lentera, temukan ritme yang lebih pelan. Tak ada yang perlu dikejar di sini.' },
  { name: 'Paviliun sunyi', japanese: '静寂', number: '03', theme: 'temple', note: 'Ruang untuk kembali hadir.', text: 'Duduk sejenak. Dengarkan angin. Biarkan ruang yang sederhana mengingatkan pada hal-hal yang berarti.' },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.4" /></svg>;
}

function AmbientSound() {
  const [enabled, setEnabled] = useState(false);
  const context = useRef<AudioContext | null>(null);
  const volume = useRef<GainNode | null>(null);
  useEffect(() => () => { void context.current?.close(); }, []);
  async function toggle() {
    if (!context.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      [130.81, 196, 261.63, 392].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const tone = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.detune.value = index % 2 ? 3 : -3;
        tone.gain.value = 0.035 / (index + 1);
        oscillator.connect(tone).connect(gain);
        oscillator.start();
      });
      context.current = ctx;
      volume.current = gain;
    }
    await context.current.resume();
    volume.current!.gain.setTargetAtTime(enabled ? 0 : 0.8, context.current.currentTime, 0.3);
    setEnabled(!enabled);
  }
  return <button className={`sound-toggle ${enabled ? 'playing' : ''}`} onClick={() => void toggle()} aria-pressed={enabled} aria-label={enabled ? 'Matikan suara ambien' : 'Aktifkan suara ambien'}><span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span><span>Suara {enabled ? 'aktif' : 'nonaktif'}</span></button>;
}

export default function App() {
  const [activeSpace, setActiveSpace] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visitSaved, setVisitSaved] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const dialog = useRef<HTMLDialogElement>(null);
  const [minDate] = useState(() => { const date = new Date(); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 10); });

  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function openVisit() { setVisitSaved(false); dialog.current?.showModal(); setMenuOpen(false); }
  function saveVisit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setVisitSaved(true); }

  return <>
    <a className="skip-link" href="#tentang">Lewati ke konten</a>
    <header className="site-header">
      <a className="wordmark" href="#beranda" aria-label="Kage beranda">KAGE<span className="brand-seal" lang="ja">影</span></a>
      <nav className={menuOpen ? 'navigation open' : 'navigation'} id="main-navigation" aria-label="Navigasi utama">
        <a href="#tentang" onClick={() => setMenuOpen(false)}>Filosofi</a><a href="#ruang" onClick={() => setMenuOpen(false)}>Jelajahi ruang</a><button onClick={openVisit}>Rencanakan kunjungan <Arrow diagonal /></button>
      </nav>
      <button className="menu-toggle" aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Tutup −' : 'Menu +'}</button>
    </header>

    <main>
      <section className="hero" id="beranda" aria-labelledby="hero-heading">
        <div className="hero-landscape" aria-hidden="true"><div className="fallback-moon" /><div className="fallback-mountain mountain-one" /><div className="fallback-mountain mountain-two" /><div className="fallback-gate"><i /><b /><em /></div></div>
        <Suspense fallback={null}><TempleScene theme={spaces[activeSpace].theme} onStatus={setSceneState} /></Suspense>
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="eyebrow"><span className="tiny-line" /> DI ANTARA CAHAYA DAN SUNYI</div>
          <h1 id="hero-heading">Ada cerita<br />di dalam<br /><em>keheningan.</em></h1>
          <p>Sebuah langkah menjauh dari riuh.<br />Sebuah perjalanan kembali pada diri.</p>
          <a className="primary-button" href="#ruang">Mulai perjalanan <Arrow /></a>
        </div>
        <div className="vertical-script" lang="ja">静けさの中に、美しさがある<span>THERE IS BEAUTY IN STILLNESS</span></div>
        <div className="hero-bottom"><a className="scroll-hint" href="#tentang"><span className="scroll-line" />GULIR UNTUK MENJELAJAHI</a><span className="scene-caption">{sceneState === 'fallback' ? 'LANSKAP SENJA' : 'SENJA DI KAGE'} <i /> 夕暮れ</span><AmbientSound /></div>
        <div className="hero-stamp" lang="ja">間</div>
      </section>

      <section className="philosophy section-padding" id="tentang" aria-labelledby="philosophy-heading">
        <div className="section-label reveal"><span>01 — FILOSOFI KAGE</span><span lang="ja">陰と光</span></div>
        <div className="philosophy-grid reveal"><div className="small-note">BUKAN SEKADAR TEMPAT.<br />SEBUAH CARA UNTUK HADIR.</div><div><h2 id="philosophy-heading">Yang indah tak selalu<br />meminta <em>perhatian.</em></h2><div className="philosophy-copy"><p>Kage berarti bayangan. Ruang di antara terang dan gelap, di antara langkah dan jeda. Di sinilah kami menemukan keindahan yang tak perlu banyak kata.</p><p>Terinspirasi oleh ketenangan kuil Jepang, perjalanan ini mengajak Anda melambat. Menyadari detail kecil. Dan menemukan bahwa, terkadang, cukup hanya hadir.</p></div><span className="signature">余白を感じる <i>Rasakan ruang di antaranya.</i></span></div></div>
      </section>

      <section className="spaces section-padding" id="ruang" aria-labelledby="spaces-heading">
        <div className="section-label reveal"><span>02 — RUANG UNTUK MENEMUKAN</span><span lang="ja">三つの道</span></div>
        <div className="section-heading reveal"><h2 id="spaces-heading">Setiap langkah,<br /><em>suasana baru.</em></h2><p>Tiga ruang. Tiga cara untuk melambat.<br />Pilih ke mana rasa ingin tahu membawa Anda.</p></div>
        <div className="space-tabs reveal" role="tablist" aria-label="Pilih ruang Kage">{spaces.map((space, index) => <button key={space.theme} type="button" role="tab" id={`space-tab-${index}`} aria-controls="space-panel" aria-selected={activeSpace === index} tabIndex={activeSpace === index ? 0 : -1} className={activeSpace === index ? 'space-tab active' : 'space-tab'} onClick={() => setActiveSpace(index)} onKeyDown={event => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? spaces.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + spaces.length) % spaces.length; setActiveSpace(next); document.getElementById(`space-tab-${next}`)?.focus(); } }}><span className="space-number">{space.number}</span><span>{space.name}<small>{space.note}</small></span><span className="space-tab-jp" lang="ja">{space.japanese}</span><Arrow diagonal /></button>)}</div>
        <div className={`space-panel theme-${spaces[activeSpace].theme}`} role="tabpanel" id="space-panel" aria-labelledby={`space-tab-${activeSpace}`} tabIndex={0}>
          <div className="landscape-art" aria-hidden="true"><div className="art-moon" /><div className="art-hill hill-back" /><div className="art-hill hill-front" /><div className="art-pines left-pines" /><div className="art-pines right-pines" /><div className="art-path" /><div className="art-torii"><i /><b /><em /></div><div className="art-lantern lantern-one" /><div className="art-lantern lantern-two" /><span className="art-grain" /></div>
          <div className="panel-top"><span>PETIKAN PERJALANAN</span><span lang="ja">{spaces[activeSpace].japanese}</span></div>
          <div className="panel-caption" key={activeSpace}><div><span className="eyebrow">RUANG {spaces[activeSpace].number}</span><h3>{spaces[activeSpace].name}</h3><p>{spaces[activeSpace].text}</p></div><a className="round-link" href="#beranda" aria-label={`Lihat suasana ${spaces[activeSpace].name} dalam adegan interaktif`}><Arrow diagonal /></a></div>
        </div>
      </section>

      <section className="invitation section-padding" id="kunjungi" aria-labelledby="invitation-heading"><div className="reveal"><span className="invitation-symbol" lang="ja">心</span><div className="eyebrow">TAK PERLU TERBURU-BURU</div><h2 id="invitation-heading">Luangkan waktu.<br /><em>Temukan sunyi Anda.</em></h2><p>Beberapa perjalanan tak diukur dari seberapa jauh,<br />melainkan dari seberapa dalam kita merasakan.</p><button className="primary-button" onClick={openVisit}>Rencanakan kunjungan <Arrow /></button><span className="invitation-footnote">Sebuah ruang digital. Selalu terbuka untuk Anda.</span></div></section>
    </main>
    <footer className="site-footer"><a className="wordmark" href="#beranda">KAGE<span className="brand-seal" lang="ja">影</span></a><p>Dibuat untuk jeda di antara hari.</p><span>© {new Date().getFullYear()} Kage</span><a href="#beranda">Kembali ke atas ↑</a></footer>

    <dialog ref={dialog} className="visit-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} aria-labelledby="visit-heading"><button className="dialog-close" aria-label="Tutup rencana kunjungan" onClick={() => dialog.current?.close()}>×</button>{visitSaved ? <div className="visit-success" role="status"><span className="success-mark">✓</span><div className="eyebrow">SEBUAH JEDA TELAH DIPILIH</div><h2 id="visit-heading">Sampai jumpa<br /><em>di dalam sunyi.</em></h2><p>Rencana Anda untuk {new Date(`${visitDate}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} sudah dicatat di halaman ini. Kage adalah pengalaman digital; tidak ada reservasi fisik atau data yang dikirim.</p><button className="primary-button" onClick={() => { dialog.current?.close(); document.getElementById('beranda')?.scrollIntoView({ behavior: 'smooth' }); }}>Masuk ke Kage <Arrow /></button></div> : <form onSubmit={saveVisit}><div className="eyebrow">SEBUAH WAKTU UNTUK DIRI</div><h2 id="visit-heading">Rencanakan<br /><em>jeda Anda.</em></h2><p>Pilih satu hari untuk melambat. Ini adalah pengingat di halaman ini, bukan pemesanan tempat fisik.</p><label htmlFor="visit-date">Tanggal kunjungan digital</label><input required type="date" id="visit-date" min={minDate} value={visitDate} onChange={event => setVisitDate(event.target.value)} /><label htmlFor="visit-space">Ruang yang ingin dijelajahi</label><select id="visit-space" value={activeSpace} onChange={event => setActiveSpace(Number(event.target.value))}>{spaces.map((space, index) => <option value={index} key={space.theme}>{space.name}</option>)}</select><button className="primary-button" type="submit">Catat rencana <Arrow /></button></form>}</dialog>
  </>;
}
