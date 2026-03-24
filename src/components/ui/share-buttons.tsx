'use client';
import { useState } from 'react';
import { shareToWhatsApp, shareToTelegram, copyToClipboard } from '@/lib/share';

interface ShareButtonsProps {
  text: string;         // formatted text to share
  shareUrl?: string;    // public URL for Telegram link
  label?: string;       // e.g. "Share Standings"
  compact?: boolean;    // icon-only compact mode
}

export default function ShareButtons({ text, shareUrl, label = 'Share', compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="relative">
        <button onClick={() => setOpen(v => !v)}
          className="p-2 bg-white border border-slate-200 hover:border-sky-300 rounded-xl text-slate-500 hover:text-slate-900 transition-colors">
          📤
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-10 z-50 bg-white border border-slate-200 rounded-2xl p-3 min-w-44 shadow-lg space-y-1">
              <button onClick={() => { shareToWhatsApp(text); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm text-slate-700 transition-colors">
                <span className="text-lg">💬</span> WhatsApp
              </button>
              <button onClick={() => { shareToTelegram(text, shareUrl); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm text-slate-700 transition-colors">
                <span className="text-lg">✈️</span> Telegram
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button onClick={() => { handleCopy(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm text-slate-500 transition-colors">
                <span className="text-lg">{copied ? '✅' : '📋'}</span> {copied ? 'Copied!' : 'Copy text'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => shareToWhatsApp(text)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bf5a] rounded-xl text-white text-sm font-semibold transition-all hover:scale-105">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </button>

      <button onClick={() => shareToTelegram(text, shareUrl)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] rounded-xl text-white text-sm font-semibold transition-all hover:scale-105">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        Telegram
      </button>

      <button onClick={handleCopy}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${copied ? 'bg-green-500 text-white' : 'bg-white border border-slate-200 hover:border-sky-300 text-slate-600'}`}>
        {copied ? '✅ Copied!' : '📋 Copy text'}
      </button>
    </div>
  );
}
