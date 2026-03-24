'use client';
import ShareButtons from './share-buttons';

interface Props {
  text: string;
  shareUrl?: string;
  label?: string;
}

export default function ShareButtonsWrapper({ text, shareUrl, label }: Props) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-sm font-medium text-slate-300 mb-3">📤 {label || 'Share'}</p>
      <ShareButtons text={text} shareUrl={shareUrl} />
    </div>
  );
}
