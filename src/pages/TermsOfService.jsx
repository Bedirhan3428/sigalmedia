import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

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
                    <FileText size={17} color="#6366f1" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>Kullanım Koşulları</span>
                </div>
                <div style={{ width: 36 }} />
            </div>

            <div style={contentStyle}>
                <div style={metaStyle}>Son Güncelleme: 5 Mart 2026</div>

                <p style={introStyle}>
                    Bu Kullanım Koşulları ("Sözleşme"), Şigal Medya ("Platform") ile platformu kullanan
                    gerçek kişi kullanıcılar ("Kullanıcı") arasında elektronik ortamda akdedilmiş bir
                    sözleşmedir. Platforma erişimle birlikte Kullanıcı, işbu Sözleşme'nin tüm
                    hükümlerini okuduğunu, anladığını ve kabul ettiğini beyan etmiş sayılır.
                </p>

                <Section title="1. Taraflar ve Kapsam">
                    <p style={paraStyle}>
                        İşbu Sözleşme; öğrencilerin sosyal etkileşim kurmasına ve okul gündemini takip
                        etmesine olanak tanıyan Şigal Medya platformunun kullanım koşullarını
                        düzenlemektedir. Sözleşme, Platformun tüm sayfa ve işlevleri için geçerlidir.
                    </p>
                </Section>

                <Section title="2. Üyelik ve Kimlik Doğrulaması">
                    <Item title="Kayıt Şartı">
                        Platforma kayıt olabilmek için geçerli bir e-posta adresi sağlanması
                        zorunludur. Sağlanan e-posta adresi, kullanıcının platformdaki hukuki kimlik
                        anahtarını oluşturur.
                    </Item>
                    <Item title="Anonimlik ve Hesap Bağlantısı">
                        Kullanıcı adı ve avatar bilgisi platformda anonim olarak görüntülense de
                        tüm paylaşımlar veri tabanında kayıtlı e-posta adresiyle ilişkilendirilir.
                        Bu uygulama, siber zorbalığın önlenmesine yönelik bir güvenlik tedbiridir.
                    </Item>
                    <Item title="Hesap Güvenliği">
                        Hesap kimlik bilgilerinin güvenliğinden yalnızca Kullanıcı sorumludur.
                        Hesap üzerinden gerçekleştirilen tüm işlemler, Kullanıcıya ait kabul edilir.
                    </Item>
                </Section>

                <Section title="3. İçerik Standartları">
                    <Item title="Otomatik Denetim">
                        İletilen her metin ve görsel, platform veri tabanına kaydedilmeden önce
                        yapay zeka sisteminden geçirilir. Sistem standartlarını karşılamayan
                        içerikler reddedilir ve paylaşım kotasından düşülmez.
                    </Item>
                    <Item title="Yasaklı İçerikler">
                        Ağır hakaret, nefret söylemi, ırk veya köken ayrımcılığı, cinsel içerik,
                        şiddet unsurları ve kişilerin onurunu zedeleyecek nitelikteki siber zorbalık
                        içerikleri kesinlikle yasaktır.
                    </Item>
                    <Item title="Görsel Kuralı">
                        Paylaşılan görsellerde tanımlanabilir insan yüzü veya vücudu bulunmamalıdır;
                        yalnızca mekân, nesne veya metin içeren görsellere izin verilir.
                    </Item>
                    <Item title="Kişisel Veri İfşası">
                        Herhangi bir kişiye ait isim, soyisim, iletişim bilgisi veya benzeri kişisel
                        verinin rızasız paylaşılması kesinlikle yasaktır.
                    </Item>
                </Section>

                <Section title="4. Kullanım Limitleri">
                    <Item title="Günlük Paylaşım Kotası">
                        Her Kullanıcı günde en fazla 3 (üç) adet içerik paylaşabilir. Yapay zeka
                        denetiminden geçemeyen içerikler bu kotayı tüketmez.
                    </Item>
                    <Item title="Adil Kullanım">
                        Otomatik bot trafiği, koordineli spam girişimleri veya sistemi manipüle
                        etmeye yönelik her türlü faaliyet, ilgili hesabın kalıcı olarak askıya
                        alınmasıyla sonuçlanır.
                    </Item>
                </Section>

                <Section title="5. Veri Saklama Süreleri">
                    <Item title="Görsel İçerikler">
                        Platforma yüklenen tüm görseller, yükleme tarihinden itibaren 30 (otuz)
                        takvim günü sonunda sistemden otomatik ve kalıcı olarak silinir.
                    </Item>
                    <Item title="Metin İçerikleri">
                        Metin içerikleri; Kullanıcı hesabını silene veya söz konusu içerik
                        platformdan kaldırılana kadar saklanır.
                    </Item>
                </Section>

                <Section title="6. Sorumluluk Sınırlaması">
                    <Item title="Platform Niteliği">
                        Şigal Medya, öğrenci geliştiriciler tarafından yürütülen bağımsız bir
                        projedir. Teknik arızalar, veri kayıpları veya hizmet kesintilerinden
                        dolayı geliştirici ekip hukuki sorumluluk üstlenmez.
                    </Item>
                    <Item title="Kullanıcı İçeriği">
                        Kullanıcılar tarafından oluşturulan içerikler, Platform'un görüşlerini
                        temsil etmez. Her Kullanıcı, kendi paylaşımlarından hukuki olarak
                        münferiden sorumludur.
                    </Item>
                </Section>

                <Section title="7. Sözleşmenin Sona Ermesi">
                    <p style={paraStyle}>
                        İşbu Sözleşme'nin herhangi bir hükmünü ihlal eden, siber zorbalık
                        eylemlerini sürdüren veya sistemi kötüye kullanan Kullanıcıların hesapları
                        önceden bildirim yapılmaksızın askıya alınabilir ya da kalıcı olarak kapatılabilir.
                        Bu durumda Kullanıcı, platforma yeniden erişim hakkını yitirir.
                    </p>
                </Section>

                <div style={footerStyle}>
                    © 2026 Şigal Medya — Tüm hakları saklıdır.
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={{ marginBottom: '24px' }}>
            <h2 style={{
                fontSize: '13.5px', fontWeight: 700, color: '#e4e4e7',
                marginBottom: '10px', paddingBottom: '8px',
                borderBottom: '1px solid #27272a',
                display: 'flex', alignItems: 'center', gap: '8px',
            }}>
                <span style={{ width: 3, height: 14, background: '#6366f1', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
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
    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '10px',
};
const paraStyle = { fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65, margin: 0 };
const footerStyle = {
    marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #27272a',
    fontSize: '11px', color: '#3f3f46', textAlign: 'center',
};