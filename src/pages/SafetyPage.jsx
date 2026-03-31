import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const LAYERS = [
    {
        id: '01',
        name: '\u0130\u00e7erik \u00d6n Denetimi',
        description:
            'Kullan\u0131c\u0131 taraf\u0131ndan iletilen her i\u00e7erik, platform veritaban\u0131na kaydedilmeden \u00f6nce otomatik analiz sisteminden ge\u00e7irilir. Sistem; nefret s\u00f6ylemi, ki\u015fisel bilgi if\u015fas\u0131 (doxxing) ve a\u00e7\u0131k tehdit i\u00e7eren payla\u015f\u0131mlar\u0131 tespit ederek reddeder. Ba\u011flam analizi sayesinde akademik i\u00e7erik ve ele\u015ftiri niteli\u011findeki ifadeler bu kapsam\u0131n d\u0131\u015f\u0131nda tutulur.',
    },
    {
        id: '02',
        name: 'Ak\u0131\u015f \u0130zleme',
        description:
            'Yorum ak\u0131\u015flar\u0131 s\u00fcrekli olarak taran\u0131r. Koordineli taciz dizileri, t\u0131rmanan agresif yorum zincirleri ve duygusal manip\u00fclasyon i\u00e7eren i\u00e7erikler sistem taraf\u0131ndan tespit edilerek gizlenir. Sayg\u0131l\u0131 bi\u00e7imde ifade edilen farkl\u0131 g\u00f6r\u00fc\u015fler ve yap\u0131c\u0131 ele\u015ftiriler bu i\u015flemin kapsam\u0131 d\u0131\u015f\u0131ndad\u0131r.',
    },
    {
        id: '03',
        name: 'Derinlemesine Denetim',
        description:
            'Yo\u011fun raporlama veya \u015f\u00fcpheli faaliyet tespiti durumunda \u00fcst d\u00fczey denetim modu devreye girer. \u0130lgili i\u00e7erik topluluk standartlar\u0131 \u00e7er\u00e7evesinde de\u011ferlendirilir; ihlal saptanmas\u0131 h\u00e2linde cihaz kimli\u011fi kaydedilerek eri\u015fim k\u0131s\u0131tlan\u0131r. Bu i\u015flem yaln\u0131zca ciddi vakalara uygulan\u0131r.',
    },
];

const ROLES = [
    {
        name: 'GHOST',
        description:
            'Varsay\u0131lan kullan\u0131c\u0131 stat\u00fcs\u00fc. Kimlik bilgileri \u015fifrelenmi\u015f olarak saklan\u0131r; insan moderat\u00f6rler taraf\u0131ndan g\u00f6r\u00fcnt\u00fclenemez.',
    },
    {
        name: 'SENTINEL',
        description:
            'G\u00fcvenilir topluluk \u00fcyesi stat\u00fcs\u00fc. Raporlama yetkileri geni\u015fletilmi\u015f olup bildirimleri \u00f6ncelikli inceleme kuyru\u011funa al\u0131n\u0131r.',
    },
    {
        name: 'WARDEN',
        description:
            'K\u0131demli moderat\u00f6r stat\u00fcs\u00fc. Denetim sonu\u00e7lar\u0131n\u0131 inceleme ve itiraz s\u00fcre\u00e7lerini y\u00f6netme yetkisine sahiptir.',
    },
];

export default function SafetyPage() {
    const navigate = useNavigate();

    return (
        <div style={pageStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <button onClick={() => navigate(-1)} style={backBtnStyle}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={17} color="#818cf8" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>G\u00fcvenlik Politikas\u0131</span>
                </div>
                <div style={{ width: 36 }} />
            </div>

            <div style={contentStyle}>
                <div style={metaStyle}>Y\u00fcr\u00fcrl\u00fck Tarihi: 2026 \u00b7 Sigal Media</div>

                {/* Intro */}
                <p style={introStyle}>
                    Sigal Media, kullan\u0131c\u0131lar\u0131n\u0131n dijital g\u00fcvenli\u011fini sa\u011flamak amac\u0131yla \u00e7ok katmanl\u0131 bir
                    otomatik denetim sistemi i\u015fletmektedir. Bu politika, s\u00f6z konusu sistemin kapsam\u0131n\u0131,
                    i\u015fleyi\u015fini ve kullan\u0131c\u0131 haklar\u0131n\u0131 a\u00e7\u0131klamaktad\u0131r.
                </p>

                {/* Layers */}
                <Section title="Denetim Katmanlar\u0131" accent="#818cf8">
                    {LAYERS.map((l) => (
                        <Item key={l.id} title={`${l.id} \u2014 ${l.name}`}>
                            {l.description}
                        </Item>
                    ))}
                </Section>

                {/* Anonymity */}
                <Section title="Anonimlik ve Ki\u015fisel Veri" accent="#a78bfa">
                    <p style={paraStyle}>
                        Platform, kullan\u0131c\u0131 kimli\u011fini do\u011frulama amac\u0131yla yaln\u0131zca \u015fifrelenmi\u015f bir cihaz
                        tan\u0131mlay\u0131c\u0131s\u0131 i\u015fler. Bu tan\u0131mlay\u0131c\u0131; ger\u00e7ek ad, e-posta adresi veya di\u011fer ki\u015fisel
                        bilgilerle ili\u015fkilendirilmez. G\u00fcvenlik ihlali durumunda bile kullan\u0131c\u0131n\u0131n ger\u00e7ek
                        kimli\u011fi insan moderat\u00f6rler taraf\u0131ndan eri\u015filemez durumdad\u0131r.
                    </p>
                    <p style={paraStyle}>
                        Kullan\u0131c\u0131 kimlik bilgilerinin \u00fc\u00e7\u00fcnc\u00fc taraflarla payla\u015f\u0131lmas\u0131 yaln\u0131zca yetkili
                        makamlardan gelen yasal talepler do\u011frultusunda ve y\u00fcr\u00fcrl\u00fckteki mevzuat
                        \u00e7er\u00e7evesinde ger\u00e7ekle\u015ftirilir.
                    </p>
                </Section>

                {/* Roles */}
                <Section title="Topluluk Rolleri" accent="#818cf8">
                    {ROLES.map((r) => (
                        <Item key={r.name} title={r.name}>{r.description}</Item>
                    ))}
                </Section>

                {/* Reporting */}
                <Section title="\u0130hlal Bildirimi" accent="#818cf8">
                    <p style={paraStyle}>
                        Otomatik denetim sisteminin tespit edemedi\u011fi i\u00e7erikleri topluluk raporlama kanal\u0131
                        arac\u0131l\u0131\u011f\u0131yla bildirebilirsin. Her bildiri, derinlemesine denetim s\u00fcrecini tetikler ve
                        24 saat i\u00e7inde sonu\u00e7land\u0131r\u0131l\u0131r. Bildirinin t\u00fcm a\u015famalar\u0131nda kullan\u0131c\u0131 kimli\u011fi gizli
                        tutulur.
                    </p>