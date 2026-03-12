export function renderWithHashtags(text) {
    if (!text) return null;
    const parts = text.split(/(#[\wğüşıöçĞÜŞİÖÇ]+)/g);
    return parts.map((part, i) =>
        part.startsWith('#')
            ? <span key={i} style={{ color: '#6366f1', fontWeight: 600 }}>{part}</span>
            : part
    );
}