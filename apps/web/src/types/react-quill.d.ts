declare module 'react-quill' {
  import type { ComponentType } from 'react';

  type ReactQuillProps = {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    theme?: string;
    modules?: Record<string, unknown>;
    formats?: string[];
    readOnly?: boolean;
  };

  const ReactQuill: ComponentType<ReactQuillProps>;
  export default ReactQuill;
}
