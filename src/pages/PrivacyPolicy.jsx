import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import '../styles/auth.css';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="#10b981" />
          <h1 style={headerTitleStyle}>Gizlilik Politikası</h1>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* İçerik */}
      <div style={contentStyle}>
        <div style={metaStyle}>Yürürlük Tarihi: 5 Mart 2026</div>

        <p style={introStyle}>
          Şigal Medya ekibi olarak, gizliliğine en az senin kadar önem veriyoruz. Bu politika,
          platformumuzu kullanırken hangi verilerinin toplandığını, bu verilerin nasıl kullanıldığını
          ve güvenliğinin nasıl sağlandığını açıklar. Sitemizi kullanarak bu politikayı kabul etmiş
          sayılırsın.
        </p>

        <Section title="1. Toplanan Veriler ve Yöntemler" accent="#10b981">
          <p style={paraStyle}>
            Şigal Medya, <strong style={strongStyle}>"minimum veri, maksimum gizlilik"</strong> ilkesiyle
            çalışır. Bu kapsamda sadece şu veriler toplanır:
          </p>
          <Item title="E-Posta Adresi">
            Firebase Auth üzerinden kayıt olurken sağladığın e-posta adresi. Bu, senin platformdaki
            kimlik doğrulamandır.
          </Item>
          <Item title="Hesap Bilgileri">
            Sistem tarafından sana atanan kullanıcı adı (rumuz) ve avatar bilgisi.
          </Item>
          <Item title="İçerik Verileri">
            Paylaştığın metinler ve görseller.
          </Item>
          <Item title="Teknik Günlükler">
            Güvenliği sağlamak adına IP adresi ve cihaz tipi gibi anonim teknik bilgiler
            (sadece siber saldırıları ve botları engellemek amacıyla sınırlı süreyle tutulur).
          </Item>
        </Section>

        <Section title="2. Verilerin Kullanım Amacı" accent="#10b981">
          <Item title="Güvenlik ve Doğrulama">
            Hesabına güvenli giriş yapmanı sağlamak.
          </Item>
          <Item title="Siber Zorbalıkla Mücadele">
            Platform kurallarının ihlal edilmesi durumunda, ihlali gerçekleştiren hesabı tespit
            etmek ve gerekli yaptırımları uygulamak.
          </Item>
          <Item title="Yapay Zeka Moderasyonu">
            Paylaşımlarının topluluk kurallarına uygunluğunu Groq (Llama 3) teknolojisi ile
            denetlemek.
          </Item>
          <Item title="Sıralama Algoritması">
            Paylaşımlarının aldığı etkileşime göre "Hot Score" (Popülerlik Puanı) hesaplayarak
            ana sayfayı taze tutmak.
          </Item>
        </Section>

        <Section title="3. Görsel Veriler ve 30 Gün Kuralı" accent="#f97316">
          <div style={highlightBoxStyle}>
            <p style={{ color: '#fb923c', fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>
             Otomatik Silme Politikası
            </p>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.65 }}>
              Paylaştığın tüm görseller Firebase Storage üzerinde saklanır. Yüklenen görseller,
              paylaşıldığı andan itibaren <strong style={{ color: '#fb923c' }}>30 gün sonra</strong> sistemimizden
              geri döndürülemez şekilde otomatik olarak silinir. Bu süreden sonra görsele erişim
              mümkün değildir.
            </p>
          </div>
        </Section>

        <Section title="4. Veri Saklama ve Üçüncü Taraflar" accent="#10b981">
          <Item title="Satış Yok">
            Kişisel veriler (e-posta vb.) asla üçüncü şahıslara veya reklam şirketlerine
            satılmaz, kiralanmaz.
          </Item>
          <Item title="Altyapı Sağlayıcıları">
            Verileriniz güvenli bulut servislerinde (MongoDB Atlas, Firebase, Render.com)
            şifrelenmiş olarak saklanır.
          </Item>
          <Item title="Yasal Zorunluluk">
            Sadece resmi makamlardan (Savcılık, Emniyet vb.) gelen yasal talepler doğrultusunda,
            hukuki yükümlülükler çerçevesinde veri paylaşımı yapılabilir.
          </Item>
        </Section>

        <Section title="5. Çerezler (Cookies) ve Yerel Depolama" accent="#10b981">
          <p style={paraStyle}>
            Sitemizde, her seferinde giriş yapman gerekmesin diye <strong style={strongStyle}>Local Storage
            (Yerel Depolama)</strong> teknolojisi kullanılır. Bu teknoloji, sadece oturumunun açık kalmasını
            sağlayan dijital bir anahtar tutar; seni internette takip etmez.
          </p>
        </Section>

        <Section title="6. Kullanıcı Hakları (KVKK Kapsamında)" accent="#10b981">
          <p style={paraStyle}>Dilediğin zaman şu haklara sahipsin:</p>
          {[
            'Sistemde kayıtlı e-posta adresini öğrenmek.',
            'Hesabının ve tüm paylaşımlarının kalıcı olarak silinmesini talep etmek.',
            'Verilerinin nasıl işlendiği hakkında bilgi almak.',
          ].map((item, i) => (
            <div key={i} style={bulletStyle}>
              <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65 }}>{item}</span>
            </div>
          ))}
        </Section>

        <Section title="7. Güvenlik" accent="#10b981">
          <p style={paraStyle}>
            Verilerini korumak için endüstri standardı olan SSL sertifikaları, API anahtarı
            gizleme ve hız sınırlama (Rate Limiting) gibi güvenlik katmanları kullanıyoruz.
            Backend sistemimiz, yetkisiz erişimleri engellemek için sürekli denetlenmektedir.
          </p>
        </Section>

        <div style={footerNoteStyle}>
          © 2026 Şigal Medya — Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
}

function Section({ title, accent = '#6366f1', children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{
        fontSize: '14px',
        fontWeight: 700,
        color: '#e4e4e7',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: `1px solid #27272a`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ width: 3, height: 16, background: accent, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  );
}

function Item({ title, children }) {
  return (
    <div style={{
      fontSize: '13.5px',
      color: '#a1a1aa',
      lineHeight: 1.65,
      paddingLeft: '12px',
      borderLeft: '2px solid #27272a',
    }}>
      <span style={{ color: '#e4e4e7', fontWeight: 600 }}>{title}: </span>
      <span>{children}</span>
    </div>
  );
}

// ─── Stiller ─────────────────────────────────────
const pageStyle = {
  minHeight: '100dvh',
  backgroundColor: '#05050a',
  color: '#f1f1f5',
  fontFamily: "'Outfit', system-ui, sans-serif",
};

const headerStyle = {
  position: 'sticky', top: 0, zIndex: 10,
  backgroundColor: 'rgba(5,5,10,0.9)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid #27272a',
  padding: '12px 16px',
  paddingTop: 'max(12px, env(safe-area-inset-top))',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  maxWidth: '680px', margin: '0 auto',
};

const headerTitleStyle = { fontSize: '15px', fontWeight: 700, color: '#f1f1f5' };

const backBtnStyle = {
  background: 'none', border: 'none', color: '#71717a', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 36, height: 36, borderRadius: '8px',
  WebkitTapHighlightColor: 'transparent',
};

const contentStyle = {
  maxWidth: '680px', margin: '0 auto', padding: '24px 16px 48px',
};

const metaStyle = {
  fontSize: '12px', color: '#52525b', marginBottom: '16px',
};

const introStyle = {
  fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7, marginBottom: '24px',
  padding: '14px 16px',
  background: 'rgba(16,185,129,0.07)',
  border: '1px solid rgba(16,185,129,0.15)',
  borderRadius: '10px',
};

const paraStyle = {
  fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65,
};

const strongStyle = { color: '#e4e4e7' };

const highlightBoxStyle = {
  background: 'rgba(249,115,22,0.08)',
  border: '1px solid rgba(249,115,22,0.2)',
  borderRadius: '10px',
  padding: '14px 16px',
};

const bulletStyle = {
  display: 'flex', alignItems: 'flex-start', gap: '10px',
};

const footerNoteStyle = {
  marginTop: '32px', paddingTop: '16px',
  borderTop: '1px solid #27272a',
  fontSize: '12px', color: '#3f3f46', textAlign: 'center',
};