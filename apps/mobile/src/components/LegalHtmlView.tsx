import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type LegalHtmlViewProps = {
  html: string;
  isRtl: boolean;
};

export function LegalHtmlView({ html, isRtl }: LegalHtmlViewProps) {
  const source = useMemo(() => {
    const direction = isRtl ? 'rtl' : 'ltr';
    const align = isRtl ? 'right' : 'left';
    const document = `<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${direction}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 0 2px 24px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #0f172a;
        line-height: 1.75;
        font-size: 16px;
        text-align: ${align};
      }
      h1, h2, h3 { color: #0f172a; margin: 1.4em 0 0.6em; line-height: 1.35; }
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1.1rem; }
      p { margin: 0.85em 0; }
      ul, ol { margin: 0.85em 0; padding-${isRtl ? 'right' : 'left'}: 1.25rem; }
      a { color: #0f9f67; }
      blockquote {
        margin: 1em 0;
        padding: 0.75em 1em;
        border-${isRtl ? 'right' : 'left'}: 4px solid #d1fae5;
        background: #f8fafc;
      }
    </style>
  </head>
  <body>${html}</body>
</html>`;
    return { html: document };
  }, [html, isRtl]);

  return (
    <View style={styles.wrap}>
      <WebView
        originWhitelist={['*']}
        source={source}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.webview}
        containerStyle={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 280,
    flexGrow: 1
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});
