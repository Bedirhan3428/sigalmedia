import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

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
                    <Shield size={17} color="#10b981" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>Gizlilik Politikası</span>
                </div>
                <div style={{ width: 36 }} />
            </div>

            <div style={contentStyle}>
                <div style={metaStyle}>Yürürlük Tarihi: 5 Mart 2026</div>

                <p style={introStyle}>
                    Bu Gizlilik Politikası, Şigal Medya'nın ("Platform") kullanıcılarına ait kişisel
                    verilerin toplanması, işlenmesi, saklanması ve korunmasına ilişkin esasları
                    düzenlemektedir. Platformu kullanmaya devam etmekle bu politikayı okuduğunu ve
                    kabul ettiğini beyan etmiş sayılırsın.
                </p>

                <Section title="1. İşlenen Kişisel Veriler" accent="#10b981">
                    <Item title="Kimlik Doğrulama Verisi">
                        Kayıt sürecinde sağlanan e-posta adresi; kimlik doğrulama amacıyla Firebase
                        Authentication altyapısı üzerinden işlenir.
                    </Item>
                    <Item title="Hesap Bilgileri">
                        Sistem tarafından atanan kullanıcı adı (takma ad) ve avatar verisi.
                    </Item>
                    <Item title="Kullanıcı İçeriği">
                        Platforma yüklenen metin ve görsel içerikler.
                    </Item>
                    <Item title="Teknik Günlükler">
                        Siber saldırıları ve otomatik bot trafiğini engellemek amacıyla IP adresi ve
                        cihaz tipi bilgileri sınırlı süreyle anonim biçimde tutulur.
                    </Item>
                </Section>

                <Section title="2. Verilerin İşlenme Amaçları" accent="#10b981">
                    <Item title="Kimlik Doğrulama">
                        Platforma güvenli erişimin sağlanması.
                    </Item>
                    <Item title="Kural İhlali Tespiti">
                        Topluluk kurallarının ihlal edilmesi hâlinde ilgili hesabın belirlenmesi ve
                        gerekli yaptırımların uygulanması.
                    </Item>
                    <Item title="Otomatik İçerik Denetimi">
                        Paylaşımların Groq (Llama 3) altyapısı kullanılarak topluluk kurallarına
                        uygunluk açısından denetlenmesi.
                    </Item>
                    <Item title="İçerik Sıralama">
                        Etkileşim verisi esas alınarak popülerlik puanının (Hot Score) hesaplanması
                        ve ana akışın güncellenmesi.
                    </Item>
                </Section>

                <Section title="3. Görsel Verilerin Saklanması ve Otomatik Silinme" accent="#f97316">
                    <div style={highlightBoxStyle}>
                        <p style={{ color: '#fb923c', fontWeight: 700, marginBottom: '6px', fontSize: '12.5px' }}>
                            Otomatik Silme Politikası
                        </p>
                        <p style={{ color: '#a1a1aa', fontSize: '13.5px', lineHeight: 1.65, margin: 0 }}>
                            Firebase Storage üzerinde saklanan tüm görseller, yüklendiği tarihten itibaren{' '}
                            <strong style={{ color: '#fb923c' }}>30 (otuz) takvim günü</strong> sonunda
                            sistemden geri döndürülemez biçimde otomatik olarak silinir. Bu sürenin
                            sona ermesinin ardından söz konusu görsellere erişim mümkün değildir.
                        </p>
                    </div>
                </Section>

                <Section title="4. Üçüncü Taraflarla Veri Paylaşımı" accent="#10b981">
                    <Item title="Ticari Amaçla Paylaşım">
                        Kişisel veriler; reklam şirketleri, veri simsarları veya üçüncü şahıslara
                        kesinlikle satılmaz ya da kiralanmaz.
                    </Item>
                    <Item title="Altyapı Sağlayıcıları">
                        Veriler; MongoDB Atlas, Firebase ve Render.com altyapıları üzerinde
                        şifrelenmiş olarak barındırılır. Bu sağlayıcılar, yalnızca teknik hizmetin
                        ifasına yönelik erişim yetkisine sahiptir.
                    </Item>
                    <Item title="Yasal Yükümlülükler">
                        Yetkili kamu kurumlarından (Cumhuriyet Savcılığı, Emniyet Müdürlüğü vb.)
                        iletilen yasal talepler doğrultusunda, yürürlükteki mevzuat kapsamında veri
                        paylaşımı gerçekleştirilebilir.
                    </Item>
                </Section>

                <Section title="5. Çerezler ve Yerel Depolama" accent="#10b981">
                    <p style={paraStyle}>
                        Platform; reklam takibi veya kullanıcı profilleme amacıyla çerez kullanmaz.
                        Oturum sürekliliğini sağlamak amacıyla yalnızca tarayıcı yerel depolama
                        (Local Storage) teknolojisinden yararlanılır. Bu veri yalnızca kullanıcının
                        kendi cihazında bulunur.
                    </p>
                </Section>

                <Section title="6. Kullanıcı Hakları (KVKK)" accent="#10b981">
                    {[
                        'Sistemde kayıtlı kişisel verilerinin neler olduğunu öğrenmek.',
                        'Kişisel verilerinin eksik veya yanlış işlendiği hâllerde düzeltilmesini talep etmek.',
                        'Hesabının ve bununla ilişkili tüm içeriklerin kalıcı olarak silinmesini talep etmek.',
                        'Kişisel verilerinin işlenme amacı ve yöntemi hakkında bilgi almak.',
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ color: '#10b981', flexShrink: 0, lineHeight: '1.65' }}>✓</span>
                            <span style={{ fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65 }}>{item}</span>
                        </div>
                    ))}
                </Section>

                <Section title="7. Veri Güvenliği" accent="#10b981">
                    <p style={paraStyle}>
                        Platform; SSL/TLS şifreleme, API anahtarı gizleme ve istek hızı sınırlama
                        (Rate Limiting) başta olmak üzere endüstri standardı güvenlik önlemleri
                        uygulamaktadır. Backend sistemleri, yetkisiz erişimlere karşı düzenli
                        olarak denetlenmektedir. Bununla birlikte, hiçbir dijital sistemin mutlak
                        güvenlik garantisi veremeyeceği kabul edilir.
                    </p>
                </Section>

                <div style={footerStyle}>
                    © 2026 Şigal Medya — Tüm hakları saklıdır.
                </div>
            </div>
        </div>
    );
}

function Section({ title, accent = '#10b981', children }) {
    return (
        <div style={{ marginBottom: '24px' }}>
            <h2 style={{
                fontSize: '13.5px', fontWeight: 700, color: '#e4e4e7',
                marginBottom: '10px', paddingBottom: '8px',
                borderBottom: '1px solid #27272a',
                display: 'flex', alignItems: 'center', gap: '8px',
            }}>
                <span style={{ width: 3, height: 14, background: accent, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
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
            fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65,
            paddingLeft: '12px', borderLeft: '2px solid #27272a',
        }}>
            <span style={{ color: '#e4e4e7', fontWeight: 600 }}>{title}: </span>
            {children}
        </div>
    );
}

const pageStyle = {
    minHeight: '100dvh', backgroundColor: '#05050a',
    color: '#f4f4f5', fontFamily: "'Outfit', system-ui, sans-serif",
};
const headerStyle = {
    position: 'sticky', top: 0, zIndex: 10,
    backgroundColor: 'rgba(5,5,10,0.92)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    borderBottom: '1px solid #18181b',
    padding: '12px 16px', paddingTop: 'max(12px, env(safe-area-inset-top))',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    maxWidth: '680px', margin: '0 auto',
};
const backBtnStyle = {
    background: 'none', border: 'none', color: '#71717a', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: '8px',
    WebkitTapHighlightColor: 'transparent',
};
const contentStyle = { maxWidth: '680px', margin: '0 auto', padding: '24px 16px 48px' };
const metaStyle = { fontSize: '12px', color: '#52525b', marginBottom: '16px' };
const introStyle = {
    fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.7, marginBottom: '24px',
    padding: '14px 16px',
    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
    borderRadius: '10px',
};
const paraStyle = { fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65, margin: 0 };
const highlightBoxStyle = {
    background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)',
    borderRadius: '10px', padding: '14px 16px',
};
const footerStyle = {
    marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #27272a',
    fontSize: '11px', color: '#3f3f46', textAlign: 'center',
};