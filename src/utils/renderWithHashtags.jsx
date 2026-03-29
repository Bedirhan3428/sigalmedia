import React from 'react';
import { useNavigate } from 'react-router-dom';

// Hashtag regex — Türkçe karakter desteği dahil
const HASHTAG_REGEX = /(#[\wğüşıöçĞÜŞİÖÇ]+)/g;

// Hook version (with navigation)
export function useHashtagRenderer() {
  // We can't use hooks inside renderWithHashtags directly,
  // so this returns a render function bound to navigate
  return function renderWithNav(text, navigate) {
    if (!text) return null;
    const parts = text.split(HASHTAG_REGEX);
    return parts.map((part, i) =>
      part.startsWith('#')
        ? (
          <span
            key={i}
            style={{ color: '#0095F6', fontWeight: 500, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (navigate) navigate(`/explore?tag=${encodeURIComponent(part.slice(1))}`);
            }}
          >
            {part}
          </span>
        )
        : part
    );
  };
}

// Simple version (no navigation — for use in non-router contexts)
export function renderWithHashtags(text) {
  if (!text) return null;
  const parts = text.split(HASHTAG_REGEX);
  return parts.map((part, i) =>
    part.startsWith('#')
      ? (
        <span
          key={i}
          className="post-hashtag"
          style={{ color: '#0095F6', fontWeight: 500, cursor: 'pointer' }}
        >
          {part}
        </span>
      )
      : part
  );
}
