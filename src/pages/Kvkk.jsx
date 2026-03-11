import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import '../styles/auth.css';

export default function Kvkk() {
  const navigate = useNavigate();

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={18} color="#a855f7" />
          <h1 style={headerTitleStyle}>KVKK Aydınlatma Metni</h1>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* İçerik */}
      <div style={contentStyle}>
        <div style={badgeStyle}>
          6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Uyarınca Hazırlanmıştır
        </div>

        <div style={metaStyle}>Veri Sorumlusu: Şigal Medya Yönetimi</div>

        <p style={introStyle}>
          Şigal Medya olarak, kullanıcılarımızın kişisel verilerinin güvenliği ve gizliliği en
          temel önceliğimizdir. Bu Aydınlatma Metni, platformumuzu kullanırken paylaştığınız
          kişisel verilerin hangi amaçlarla işlendiğini, saklanma sürelerini ve kanuni haklarınızı
          açıklamak amacıyla hazırlanmıştır.
        </p>

        <Section title="1. İşlenen Kişisel Verileriniz">
          <p style={noteStyle}>
            Platformumuzda <strong style={strongStyle}>"minimum veri"</strong> prensibi uygulanmakta olup,
            sadece aşağıdaki veriler işlenmektedir:
          </p>
          <DataRow category="İletişim Verisi">
            Kayıt ve doğrulama amacıyla kullanılan e-posta adresi.
          </DataRow>
          <DataRow category="Görsel ve İşitsel Veri">
            Kullanıcı tarafından yüklenen ve 30 gün sonra otomatik olarak silinen görseller.
          </DataRow>
          <DataRow category="İşlem Güvenliği Verisi">
            Giriş bilgileri, IP adresi ve cihaz tanımlayıcıları (sadece güvenlik ve bot koruması
            amacıyla).
          </DataRow>
          <DataRow category="İçerik Verisi">
            Kullanıcı tarafından paylaşılan metin tabanlı gönderiler.
          </DataRow>
        </Section>

        <Section title="2. Kişisel Verilerin İşlenme Amaçları">
          {[
            'Kullanıcı hesabı oluşturulması ve kimlik doğrulaması yapılması.',
            'Platform içi güvenliğin sağlanması ve siber zorbalıkla mücadele edilmesi.',
            'Yapay zeka moderasyonu aracılığıyla topluluk kurallarının ihlal edilmesinin önlenmesi.',
            'Popülerlik puanı (Hot Score) algoritması üzerinden içerik sıralamasının yapılması.',
            'Hukuki uyuşmazlıklarda yetkili kurum ve kuruluşlara bilgi verilmesi.',
          ].map((item, i) => (
            <div key={i} style={numberedStyle}>
              <span style={numberStyle}>{i + 1}</span>
              <span style={paraStyle}>{item}</span>
            </div>
          ))}
        </Section>

        <Section title="3. Kişisel Verilerin Aktarılması">
          <div style={warningBoxStyle}>
            <p style={{ color: '#a855f7', fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>
              Ticari Amaçla Asla Paylaşılmaz
            </p>
            <p style={paraStyle}>
              Toplanan kişisel veriler, ticari amaçlarla asla üçüncü şahıslara veya reklam
              şirketlerine satılmaz veya devredilmez.
            </p>
          </div>
          <p style={{ ...paraStyle, marginTop: '10px' }}>Verileriniz yalnızca:</p>
          <DataRow category="Teknik Altyapı">
            Hizmetin sürdürülmesi için kullanılan teknik altyapı sağlayıcılarına
            (Firebase, MongoDB, Render.com).
          </DataRow>
          <DataRow category="Yasal Zorunluluk">
            Yasal bir zorunluluk olması durumunda adli makamlara veya yetkili kamu kurumlarına
            aktarılabilir.
          </DataRow>
        </Section>

        <Section title="4. Veri Saklama Süreleri ve İmha Politikası">
          <DataRow category="Görsel Veriler">
            Yüklenen fotoğraflar, paylaşıldığı andan itibaren{' '}
            <strong style={{ color: '#f97316' }}>30 gün sonra</strong> sistemden geri döndürülemez
            şekilde otomatik olarak silinir.
          </DataRow>
          <DataRow category="E-posta ve Metin İçerikleri">
            Kullanıcı hesabı aktif olduğu sürece veya kullanıcı içeriği silene kadar saklanır.
            Hesap silme talebi durumunda, yasal olarak saklanması zorunlu olmayan tüm veriler
            imha edilir.
          </DataRow>
        </Section>

        <Section title="5. Veri Sahibi Olarak Haklarınız (KVKK Madde 11)">
          <p style={noteStyle}>Kanun uyarınca platformumuza başvurarak aşağıdaki haklara sahipsiniz:</p>
          {[
            'Kişisel verilerinizin işlenip işlenmediğini öğrenme,',
            'İşlenmişse buna ilişkin bilgi talep etme,',
            'Verilerin işlenme amacına uygun kullanılıp kullanılmadığını öğrenme,',
            'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,',
            'Eksik veya yanlış işlenmişse düzeltilmesini isteme,',
            'Verilerin silinmesini veya yok edilmesini isteme.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: '#a855f7', flexShrink: 0, fontSize: '13px' }}>✦</span>
              <span style={paraStyle}>{item}</span>
            </div>
          ))}
        </Section>

        <Section title="6. Rıza ve Onay">
          <div style={consentBoxStyle}>
            <p style={paraStyle}>
              Şigal Medya'ya kayıt olduğunuzda, bu aydınlatma metninde belirtilen şartları okumuş
              ve kişisel verilerinizin belirtilen amaçlar doğrultusunda işlenmesine{' '}
              <strong style={{ color: '#a855f7' }}>açık rıza vermiş</strong> sayılırsınız.
            </p>
          </div>
        </Section>

        <div style={footerNoteStyle}>
          © 2026 Şigal Medya — KVKK kapsamında hazırlanmıştır.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{
        fontSize: '14px', fontWeight: 700, color: '#e4e4e7',
        marginBottom: '12px', paddingBottom: '8px',
        borderBottom: '1px solid #27272a',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ width: 3, height: 16, background: '#a855f7', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  );
}

function DataRow({ category, children }) {
  return (
    <div style={{
      background: '#18181b', border: '1px solid #27272a',
      borderRadius: '8px', padding: '10px 12px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {category}
      </p>
      <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>{children}</p>
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
  maxWidth: '680px', margin: '0 auto', padding: '20px 16px 48px',
};

const badgeStyle = {
  background: 'rgba(168,85,247,0.08)',
  border: '1px solid rgba(168,85,247,0.2)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '11px',
  color: '#c084fc',
  fontWeight: 600,
  marginBottom: '8px',
  textAlign: 'center',
};

const metaStyle = {
  fontSize: '12px', color: '#52525b', marginBottom: '16px', textAlign: 'center',
};

const introStyle = {
  fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7, marginBottom: '24px',
  padding: '14px 16px',
  background: 'rgba(168,85,247,0.07)',
  border: '1px solid rgba(168,85,247,0.15)',
  borderRadius: '10px',
};

const paraStyle = {
  fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65,
};

const noteStyle = {
  fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65, marginBottom: '4px',
};

const strongStyle = { color: '#e4e4e7' };

const numberedStyle = {
  display: 'flex', alignItems: 'flex-start', gap: '10px',
};

const numberStyle = {
  width: 22, height: 22, borderRadius: '50%',
  background: 'rgba(168,85,247,0.15)',
  border: '1px solid rgba(168,85,247,0.25)',
  color: '#c084fc', fontSize: '11px', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, marginTop: '1px',
};

const warningBoxStyle = {
  background: 'rgba(168,85,247,0.07)',
  border: '1px solid rgba(168,85,247,0.18)',
  borderRadius: '10px',
  padding: '12px 14px',
};

const consentBoxStyle = {
  background: 'rgba(168,85,247,0.07)',
  border: '1px solid rgba(168,85,247,0.18)',
  borderRadius: '10px',
  padding: '12px 14px',
};

const footerNoteStyle = {
  marginTop: '32px', paddingTop: '16px',
  borderTop: '1px solid #27272a',
  fontSize: '12px', color: '#3f3f46', textAlign: 'center',
};