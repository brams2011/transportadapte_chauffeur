'use client';

import { useEffect } from 'react';

export default function JotFormChat() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jotfor.ms/s/umd/3007540a3e0/for-form-embed-handler.js';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).jotformEmbedHandler) {
        (window as any).jotformEmbedHandler(
          "iframe[id='JotFormIFrame-019c316345c37c149f3229f6a6ed7674fcaa']",
          "https://www.jotform.com"
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <iframe
      id="JotFormIFrame-019c316345c37c149f3229f6a6ed7674fcaa"
      title="Amara: Consultant en gestion administrative"
      allow="geolocation; microphone; camera; fullscreen"
      src="https://agent.jotform.com/019c316345c37c149f3229f6a6ed7674fcaa?embedMode=iframe&background=1&shadow=1"
      style={{
        maxWidth: '100%',
        height: '688px',
        border: 'none',
        width: '100%',
      }}
    />
  );
}
