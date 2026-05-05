<div align="center">
  <h1>📱 SigalMedia</h1>
  <p><strong>Modern, Hızlı ve Duyarlı Sosyal Medya Platformu</strong></p>
</div>

---

SigalMedia, kullanıcıların fotoğraf ve video paylaşabildiği, hikayeler oluşturabildiği, anlık mesajlaşma yapabildiği ve içerik keşfedebildiği modern, hızlı ve duyarlı (responsive) bir sosyal medya platformudur.

React ve Vite kullanılarak geliştirilmiş olup, PWA (Aşamalı Web Uygulaması) desteği sayesinde mobil cihazlara indirilebilir bir uygulama deneyimi sunar.

## ✨ Öne Çıkan Özellikler

- **🔐 Güvenli Kimlik Doğrulama:** Kullanıcı kaydı, girişi ve e-posta doğrulama sistemi.
- **📸 Gelişmiş Medya Paylaşımı:**
  - Görsel ve video yükleme.
  - Yükleme öncesi medya kırpma ve düzenleme (Image Cropper).
  - Çoklu medya desteği (Carousel).
  - Otomatik medya sıkıştırma optimizasyonu.
- **🎞️ Reels & Hikayeler (Stories):** Kısa video içerikleri (Reels) ve 24 saatlik kaybolan hikaye paylaşımları.
- **💬 Gerçek Zamanlı Mesajlaşma:** Kullanıcılar arası anlık sohbet (Chat) ve mesaj kutusu.
- **🔍 Keşfet Sayfası:** Trend olan içerikleri ve yeni kullanıcıları keşfetme.
- **👤 Profil Yönetimi:** Özelleştirilebilir kullanıcı profilleri ve gönderi geçmişi.
- **⚙️ PWA Desteği:** Çevrimdışı çalışabilme ve tarayıcı üzerinden ana ekrana uygulama olarak yüklenebilme özelliği.
- **🛡️ Yönetim Paneli (Admin Dashboard):** Platform yöneticileri için içerik ve kullanıcı denetim aracı.

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** `React.js`, `Vite`
- **Veritabanı & Backend Servisleri:** `Firebase (Realtime Database - RTDB)`, `Custom API Services`
- **Medya İşleme:** Özel kırpma (`cropUtils`) ve sıkıştırma (`mediaCompressor`) algoritmaları
- **PWA:** Service Workers (`sw.js`), Web App Manifest
- **Dağıtım (Deployment):** `Vercel` (`vercel.json` optimizasyonu ile)

---

## 🚀 Yerel Geliştirme Ortamı Kurulumu

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Gereksinimler
- Node.js (v16 veya üzeri önerilir)
- npm veya yarn

### 2. Projeyi Klonlayın
```bash
git clone https://github.com/Bedirhan3428/sigalmedia.git
cd sigalmedia
```

### 3. Bağımlılıkları Yükleyin
```bash
npm install
```

### 4. Çevre Değişkenlerini (Environment Variables) Ayarlayın
Proje dizininde bir `.env` dosyası oluşturun ve API/Firebase anahtarlarınızı ekleyin:
```env
VITE_API_KEY=your_api_key_here
VITE_DATABASE_URL=your_database_url_here
```

### 5. Uygulamayı Başlatın
```bash
npm run dev
```
*Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.*

---

## 📂 Proje Yapısı Özet

- `/src/components` : Tekrar kullanılabilir UI bileşenleri (Navbar, PostCard, Stories vb.)
- `/src/pages` : Yönlendirme yapılan ana sayfalar (Home, Feed, Profile, ChatPage vb.)
- `/src/context` : Global durum yönetimi (AuthContext, UIContext vb.)
- `/src/hooks` : Özel React hook'ları (useAnalytics, usePWAInstall vb.)
- `/src/utils` : Yardımcı fonksiyonlar (medya sıkıştırma, tarih formatlama, rtdb ayarları)
- `/public` : PWA ikonları, manifest dosyası ve Service Worker.

---

## 📜 Yasal Uyarılar ve Güvenlik

Proje içerisinde kullanıcı güvenliğini ve veri gizliliğini sağlamak adına aşağıdaki metinler entegre edilmiştir:
- KVKK (`Kvkk.jsx`)
- Gizlilik Politikası (`PrivacyPolicy.jsx`)
- Hizmet Şartları (`TermsOfService.jsx`)

---
**Geliştirici:** Bedirhan İmer
