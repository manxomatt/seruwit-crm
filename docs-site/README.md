# Seruwit Rental Mobile API — Docusaurus Documentation Site

Situs dokumentasi modern interaktif untuk seluruh set **Mobile API Rental Kendaraan** Seruwit CRM.

---

## 🚀 Cara Menjalankan Secara Lokal

Pastikan Anda memiliki **Node.js (>= 18)** terpasang di komputer.

```bash
# 1. Pindah ke direktori docs-site
cd docs-site

# 2. Pasang dependensi
npm install

# 3. Jalankan development server
npm start
```
Browser akan otomatis membuka `http://localhost:3000`.

---

## 📦 Cara Build Static HTML (Production)

```bash
cd docs-site
npm run build
```
File static siap di-deploy akan dihasilkan di dalam folder `docs-site/build/`. Folder ini dapat langsung di-host di:
* **Vercel / Netlify**
* **GitHub Pages**
* **Cloudflare Pages**
* **Nginx / Server Web Tenant**
