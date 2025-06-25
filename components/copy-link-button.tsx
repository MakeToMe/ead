'use client';

import { ExternalLink } from 'lucide-react';

interface Props {
  link: string;
}

export default function CopyLinkButton({ link }: Props) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(link);
        alert('Link copiado para a área de transferência!');
      }}
      className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
    >
      <ExternalLink className="w-4 h-4" />
      Copiar Link
    </button>
  );
}
