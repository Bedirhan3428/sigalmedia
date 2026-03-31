import React from 'react';
import { ArrowLeft, Shield, ShieldCheck } from 'lucide-react';

const LAYERS = [
    {
        id: '01',
        name: 'İçerik Ön Denetimi',
        description:
            'Kullanıcı tarafından iletilen her içerik, platform veritabanına kaydedilmeden önce otomatik analiz sisteminden geçirilir. Sistem; nefret söylemi, kişisel bilgi ifşası (doxxing) ve açık tehdit içeren paylaşımları tespit ederek reddeder. Bağlam analizi sayesinde akademik içerik ve eleştiri niteliğindeki ifadeler bu kapsamın dışında tutulur.',
    },
    {
        id: '02',
        name: 'Akış İzleme',
        description:
            'Yorum akışları sürekli olarak taranır. Koordineli taciz dizileri, tırmanan agresif yorum zincirleri ve duygusal manipülasyon içeren içerikler sistem tarafından tespit edilerek gizlenir. Saygılı biçimde ifade edilen farklı görüşler ve yapıcı eleştiriler bu işlemin kapsamı dışındadır.',
    },
    {
        id: '03',
        name: 'Derinlemesine Denetim',
        description:
            'Yoğun raporlama veya şüpheli faaliyet tespiti durumunda üst düzey denetim modu devreye girer. İlgili içerik topluluk standartları çerçevesinde değerlendirilir; ihlal saptanması hâlinde cihaz kimliği kaydedilerek erişim kısıtlanır. Bu işlem yalnızca ciddi vakalara uygulanır.',
    },
];

// Tekrar eden düzenler için yardımcı bileşenler
const Section = ({ title, accent, children }) => (
    <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: accent }}>
            {title}
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Item = ({ title, children }) => (
    <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
        <h3 className="font-semibold text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{children}</p>
    </div>
);

export default function App() {
    // Eğer projende react-router-dom varsa useNavigate kullanabilirsin:
    // const navigate = useNavigate();
    // const goBack = () => navigate(-1);
    
    // Bağımsız çalışabilmesi için tarayıcı geçmişini kullanan alternatif:
    const goBack = () => window.history.back();

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 font-sans p-4 md:p-8 flex justify-center">
            <div className="max-w-2xl w-full">
                
                {/* Header */}
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800/60 sticky top-0 bg-gray-950/80 backdrop-blur-md z-10 pt-4">
                    <button 
                        onClick={goBack} 
                        className="p-2 -ml-2 hover:bg-gray-800/60 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Shield size={18} className="text-indigo-400" />
                        <span className="text-base font-bold text-gray-100 tracking-wide">
                            Güvenlik Politikası
                        </span>
                    </div>
                    <div className="w-9" /> {/* Ortalamak için boşluk */}
                </header>

                {/* Content */}
                <div className="space-y-8 pb-12">
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                        Yürürlük Tarihi: 2026 · Sigal Media
                    </div>

                    {/* Intro */}
                    <p className="text-gray-300 leading-relaxed text-base">
                        Sigal Media, kullanıcılarının dijital güvenliğini sağlamak amacıyla çok katmanlı bir
                        otomatik denetim sistemi işletmektedir. Bu politika, söz konusu sistemin kapsamını,
                        işleyişini ve kullanıcı haklarını açıklamaktadır.
                    </p>

                    {/* AEGIS System */}
                    <Section title="AEGIS Sistemi" accent="#4ade80">
                        <div className="bg-emerald-900/10 p-5 rounded-xl border border-emerald-800/30">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck size={20} className="text-emerald-400" />
                                <h3 className="font-semibold text-emerald-300">AEGIS Nedir ve Ne İşe Yarar?</h3>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed mb-3">
                                AEGIS, Sigal Media'nın temelini oluşturan gelişmiş, yapay zeka destekli içerik denetim ve platform güvenlik motorudur. Amacı, dijital ekosistemi tüm kullanıcılar için güvenli ve temiz tutmaktır.
                            </p>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                AEGIS, platform üzerindeki tüm etkileşimleri gerçek zamanlı olarak tarar, zararlı veya manipülatif içerikleri tespit eder ve topluluk kurallarını ihlal eden eylemleri anında durdurur. İnsan moderatörlere gerek kalmadan, platformun sağlığını kesintisiz koruyan "dijital bir kalkan" olarak görev yapar.
                            </p>
                        </div>
                    </Section>

                    {/* Layers */}
                    <Section title="Denetim Katmanları" accent="#818cf8">
                        {LAYERS.map((l) => (
                            <Item key={l.id} title={`${l.id} — ${l.name}`}>
                                {l.description}
                            </Item>
                        ))}
                    </Section>

                    {/* Anonymity */}
                    <Section title="Anonimlik ve Kişisel Veri" accent="#a78bfa">
                        <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 space-y-4">
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Platform, kullanıcı kimliğini doğrulama amacıyla yalnızca şifrelenmiş bir cihaz
                                tanımlayıcısı işler. Bu tanımlayıcı; gerçek ad, e-posta adresi veya diğer kişisel
                                bilgilerle ilişkilendirilmez. Güvenlik ihlali durumunda bile kullanıcının gerçek
                                kimliği insan moderatörler tarafından erişilemez durumdadır.
                            </p>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Kullanıcı kimlik bilgilerinin üçüncü taraflarla paylaşılması yalnızca yetkili
                                makamlardan gelen yasal talepler doğrultusunda ve yürürlükteki mevzuat
                                çerçevesinde gerçekleştirilir.
                            </p>
                        </div>
                    </Section>

                    {/* Reporting */}
                    <Section title="İhlal Bildirimi" accent="#818cf8">
                        <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50">
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Otomatik denetim sisteminin (AEGIS) istisnai durumlarda tespit edemediği içerikleri topluluk raporlama kanalı
                                aracılığıyla bildirebilirsin. Her bildiri, derinlemesine denetim sürecini tetikler ve
                                24 saat içinde sonuçlandırılır. Bildirinin tüm aşamalarında kullanıcı kimliği kesinlikle gizli
                                tutulur.
                            </p>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
}

