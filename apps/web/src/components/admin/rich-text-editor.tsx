'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import 'quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const EMOJI_QUICK = ['😀', '😍', '🎉', '👍', '❤️', '🔥', '✨', '🚀', '💡', '📌', '🇴🇲', '✅'];

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ label, value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote', 'link'],
        ['clean']
      ]
    }),
    []
  );

  const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'align', 'blockquote', 'link'];

  const insertEmoji = (emoji: string) => {
    onChange(`${value}${emoji}`);
  };

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {EMOJI_QUICK.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => insertEmoji(emoji)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-lg hover:bg-slate-50"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[220px]">
        <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} formats={formats} placeholder={placeholder} />
      </div>
    </label>
  );
}
