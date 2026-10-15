# Kage

Landing page interaktif berbahasa Indonesia, dibuat dengan React, TypeScript, Vite, dan Three.js. Visual kuil, gerbang, hutan, lentera, serta suara ambien dibuat secara prosedural. Font disertakan dalam bundle; aplikasi tidak memerlukan layanan eksternal atau API key saat dijalankan.

Ini merupakan **adaptasi original**, bukan salinan source atau aset ThreeUI. Pengguna mengizinkan adaptasi setelah source resmi tidak dapat diakses. Skill yang tersimpan di `.agents/skills/add-kage-landing-page` tetap mendokumentasikan persyaratan untuk integrasi source asli apabila kelak tersedia.

## Pengembangan

Memerlukan Node.js 22.12+ atau 24 dan npm.

```sh
cd /workspace/codex
npm ci --cache /tmp/kage-npm-cache
npm run dev -- --port 5173
```

## Build

```sh
npm run build
npm run preview -- --port 4173
```

Build statis tersedia di `dist/` dan dapat di-host dengan penyedia hosting statis. Build biasa menggunakan root domain.

## GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` membangun website dengan base path `/codex/`, mengunggah artifact, lalu menerbitkannya melalui GitHub Pages setiap ada push ke `main`.

Aktifkan **Settings → Pages → Build and deployment → Source: GitHub Actions** pada repositori. Bila workflow sudah berjalan sebelum Pages diaktifkan, jalankan ulang melalui **Actions → Deploy Kage to GitHub Pages → Run workflow**.

Alamat yang dituju: `https://ekokominfo.github.io/codex/`. Status online hanya dapat dipastikan setelah deployment GitHub berhasil; push kode saja tidak mengaktifkan Pages.

Untuk memeriksa build dengan path yang sama secara lokal:

```sh
npm run build -- --base=/codex/
npm run preview -- --base=/codex/ --port 4173 --strictPort
```

## Interaksi

- Navigasi dan tombol perjalanan menggulir ke bagian halaman.
- Tiga tab ruang mengganti ilustrasi dan sudut pandang adegan 3D. Tab mendukung tombol panah, Home, dan End.
- Suara ambien menggunakan Web Audio API dan hanya aktif setelah pengguna memilihnya.
- Dialog kunjungan mencatat rencana **sementara di halaman**. Tidak ada pemesanan tempat fisik, backend, atau pengiriman data.
- Menu menyesuaikan layar ponsel, dialog mendukung Escape, dan animasi menghormati `prefers-reduced-motion`.
- Lanskap CSS tetap tampil bila WebGL tidak tersedia. Adegan berhenti saat tidak terlihat atau tab browser tersembunyi dan melepas resource saat unmount.

## Pengujian browser

```sh
npm run test:e2e
```

Pengujian memakai Chromium sistem pada `/usr/bin/chromium`. Pada mesin lain, sediakan executable melalui `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, atau jalankan `npx playwright install chromium` agar Playwright memakai browser bawaannya bila Chromium sistem tidak tersedia.
