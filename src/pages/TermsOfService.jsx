import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import '../styles/auth.css';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#6366f1" />
          <h1 style={headerTitleStyle}>Kullanım Koşulları</h1>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* İçerik */}
      <div style={contentStyle}>
        <div style={metaStyle}>Son Güncelleme: 5 Mart 2026</div>

        <p style={introStyle}>
          Şigal Medya'ya hoş geldin! Bu platform, öğrencilerin özgürce etkileşim kurabileceği,
          okul gündemini takip edebileceği bir sosyal ağdır. Bu siteyi kullanarak aşağıdaki
          kuralları kabul etmiş sayılırsın.
        </p>

        <Section title="1. Kabul ve Tanımlar">
          Bu sözleşme, Şigal Medya kullanıcıları ile geliştirici ekip arasında imzalanmış sayılır.
          Platformu kullanmaya başladığın an, buradaki tüm maddeleri okumuş, anlamış ve onaylamış
          kabul edilirsin.
        </Section>

        <Section title="2. Üyelik ve E-Posta Doğrulaması">
          <Item title="Kimlik Doğrulaması">
            Şigal Medya'ya kayıt olurken kullanılan e-posta adresi (tercihen okul maili veya şahsi
            mail), kullanıcının platformdaki tek ve gerçek kimlik anahtarıdır.
          </Item>
          <Item title="Anonimlik Sınırı">
            Kullanıcı adın platformda gizli (rumuz/avatar) olsa da, veritabanımızda tüm
            paylaşımların kayıtlı olduğun e-posta adresiyle ilişkilendirilir. Bu, siber zorbalığı
            önlemek için aldığımız bir güvenlik önlemidir.
          </Item>
          <Item title="Sorumluluk">
            E-posta hesabının güvenliği kullanıcıya aittir. Hesabın üzerinden yapılan her türlü
            paylaşım doğrudan senin sorumluluğundadır.
          </Item>
        </Section>

        <Section title="3. İçerik ve Paylaşım Kuralları">
          <Item title="Yapay Zeka Denetimi">
            Gönderdiğin her metin ve görsel, yayınlanmadan önce Yapay Zeka (AI) süzgecinden geçer.
          </Item>
          <Item title="Yasaklı İçerikler">
            Ağır küfür, nefret söylemi, ırkçılık, cinsel içerik, şiddet ve bir şahsın onurunu
            zedeleyecek doğrudan "siber zorbalık" içeren paylaşımlar sistem tarafından reddedilir.
          </Item>
          <Item title="Görsel Kuralları">
            Paylaşılan fotoğraflarda insan yüzü veya vücudu bulunamaz. Sadece mekan, nesne veya
            metin içeren görsellere izin verilir. İnsan öğesi içeren görseller moderasyon
            tarafından reddedilir.
          </Item>
          <Item title="İfşa Yasağı">
            Ekran görüntüsü paylaşırken karşı tarafın isim, soyisim veya profil fotoğrafını
            karalamak zorunludur. Kişisel veri ifşası yasaktır.
          </Item>
        </Section>

        <Section title="4. Kullanım Limitleri ve Adil Kullanım">
          <Item title="Günlük Limit">
            Her kullanıcının günde 3 adet başarılı tweet atma hakkı vardır. Yapay zeka tarafından
            reddedilen tweetler bu haktan düşmez.
          </Item>
          <Item title="Hizmet Kalitesi">
            Platformun sunucu sağlığını korumak adına yapılan bot saldırıları veya sistemli spam
            girişimleri, ilgili e-posta adresinin kalıcı olarak yasaklanmasıyla sonuçlanır.
          </Item>
        </Section>

        <Section title="5. Veri Saklama ve Silme Politikası (30 Gün Kuralı)">
          <Item title="Görsel Depolama">
            Sunucu kapasitesini korumak ve gizliliği artırmak adına, paylaşılan tüm görseller
            yüklendiği tarihten itibaren 30 gün sonra sistemden otomatik ve kalıcı olarak silinir.
          </Item>
          <Item title="Metin İçerikleri">
            Tweet metinleri, kullanıcı hesabını silene veya içerik platformdan kaldırılana kadar
            saklanabilir.
          </Item>
        </Section>

        <Section title="6. Sorumluluk Reddi">
          <Item title="Amatör Proje">
            Şigal Medya, öğrenci geliştiriciler tarafından hazırlanan amatör bir projedir.
            Sistemsel hatalardan, veri kayıplarından veya sunucu kesintilerinden dolayı geliştirici
            ekip sorumlu tutulamaz.
          </Item>
          <Item title="İçerik Sorumluluğu">
            Kullanıcılar tarafından oluşturulan içerikler, geliştiricilerin görüşlerini
            yansıtmaz. Her kullanıcı kendi beyanından hukuki olarak sorumludur.
          </Item>
        </Section>

        <Section title="7. İhlal ve Hesap Kapatma">
          Kullanım koşullarına aykırı hareket eden, siber zorbalıkta ısrar eden veya sistemi
          manipüle etmeye çalışan kullanıcıların hesapları, kayıtlı e-posta adresleri üzerinden
          sistemden engellenir. Bu durumda kullanıcının platforma tekrar erişim hakkı bulunmaz.
        </Section>

        <div style={footerNoteStyle}>
          © 2026 Şigal Medya — Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  );
}

function Item({ title, children }) {
  return (
    <div style={itemStyle}>
      <span style={itemTitleStyle}>{title}: </span>
      <span style={itemTextStyle}>{children}</span>
    </div>
  );
}

// ─── Stiller ─────────────────────────────────────
const pageStyle = {
  minHeight: '100vh',
  minHeight: '100dvh',
  backgroundColor: '#05050a',
  color: '#f1f1f5',
  fontFamily: "'Outfit', system-ui, sans-serif",
};

const headerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: 'rgba(5,5,10,0.9)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid #27272a',
  padding: '12px 16px',
  paddingTop: 'max(12px, env(safe-area-inset-top))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: '680px',
  margin: '0 auto',
};

const headerTitleStyle = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#f1f1f5',
};

const backBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#71717a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: '8px',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 0.15s, color 0.15s',
};

const contentStyle = {
  maxWidth: '680px',
  margin: '0 auto',
  padding: '24px 16px 48px',
};

const metaStyle = {
  fontSize: '12px',
  color: '#52525b',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const introStyle = {
  fontSize: '14px',
  color: '#a1a1aa',
  lineHeight: 1.7,
  marginBottom: '24px',
  padding: '14px 16px',
  background: 'rgba(99,102,241,0.07)',
  border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: '10px',
};

const sectionStyle = {
  marginBottom: '24px',
};

const sectionTitleStyle = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#e4e4e7',
  marginBottom: '10px',
  paddingBottom: '8px',
  borderBottom: '1px solid #27272a',
};

const itemStyle = {
  fontSize: '13.5px',
  color: '#a1a1aa',
  lineHeight: 1.65,
  paddingLeft: '12px',
  borderLeft: '2px solid #27272a',
};

const itemTitleStyle = {
  color: '#e4e4e7',
  fontWeight: 600,
};

const itemTextStyle = {
  color: '#a1a1aa',
};

const footerNoteStyle = {
  marginTop: '32px',
  paddingTop: '16px',
  borderTop: '1px solid #27272a',
  fontSize: '12px',
  color: '#3f3f46',
  textAlign: 'center',
};