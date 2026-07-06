'use client';

import { useCallback, useMemo, useRef, type ComponentProps, type ComponentType, type Ref } from 'react';
import ReactQuill from 'react-quill';
import type Quill from 'quill';

import 'quill/dist/quill.snow.css';

const EMOJI_QUICK = ['😀', '😍', '🎉', '👍', '❤️', '🔥', '✨', '🚀', '💡', '📌', '🇴🇲', '✅'];

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type QuillComponent = {
  getEditor(): Quill;
};

type ReactQuillProps = ComponentProps<typeof ReactQuill>;

const QuillEditor = ReactQuill as unknown as ComponentType<
  ReactQuillProps & { ref?: Ref<QuillComponent> }
>;

export function RichTextEditor({ label, value, onChange, placeholder }: RichTextEditorProps) {
  const quillRef = useRef<QuillComponent | null>(null);

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

  const insertEmoji = useCallback((emoji: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    editor.focus();
    const range = editor.getSelection(true);
    const index = range?.index ?? Math.max(0, editor.getLength() - 1);
    editor.insertText(index, emoji, 'user');
    editor.setSelection(index + emoji.length);
  }, []);

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {EMOJI_QUICK.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertEmoji(emoji)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-lg hover:bg-slate-50"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[220px]">
        <QuillEditor
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
