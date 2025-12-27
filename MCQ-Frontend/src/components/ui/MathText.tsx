import React, { useMemo, useState } from 'react';
import { View, Text, TextStyle, ViewStyle, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';

interface MathTextProps {
  children: string;
  style?: TextStyle | TextStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
}

/**
 * MathText component renders text with LaTeX math expressions.
 * Supports inline math ($...$) and block math ($$...$$).
 * Uses MathJax for rendering mathematical notation.
 */
export default function MathText({ children, style, containerStyle }: MathTextProps) {
  const { width } = useWindowDimensions();
  const [webViewHeight, setWebViewHeight] = useState(50);

  // Process the text to convert LaTeX to MathJax format
  const { processedHTML, hasMath } = useMemo(() => {
    if (!children) return { processedHTML: '', hasMath: false };

    let html = String(children);
    const originalHtml = html;

    // Check if text contains LaTeX expressions
    // Check for $ delimiters OR LaTeX commands (like \frac, \text, \sqrt, etc.)
    const hasDollarDelimiters = /\$[^$]+\$/.test(html);
    // Detect LaTeX commands: \command{...}, \command, or special symbols like \alpha, \pi, etc.
    const hasLatexCommands = /\\[a-zA-Z]+\{/.test(html) || 
                             /\\[a-zA-Z]+ /.test(html) || 
                             /\\[^a-zA-Z\s]/.test(html) ||
                             /\\text/.test(html) ||
                             /\\frac/.test(html) ||
                             /\\sqrt/.test(html);
    const containsMath = hasDollarDelimiters || hasLatexCommands;
    
    if (!containsMath) {
      return { processedHTML: html, hasMath: false };
    }

    // Escape HTML special characters
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert block math $$...$$ to MathJax block format \[...\]
    html = html.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      return `\\[${math.trim()}\\]`;
    });

    // Convert inline math $...$ to MathJax inline format \(...\)
    // Handle cases where $ might appear at start/end of string
    html = html.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, math) => {
      return `\\(${math.trim()}\\)`;
    });

    // If no $ delimiters in original but has LaTeX commands, wrap the entire content in \(...\)
    // This handles cases like options that are pure LaTeX: "\frac{2a^2}{b}" or "\text{cosec } x"
    if (!hasDollarDelimiters && hasLatexCommands) {
      // Check if content is already wrapped (after processing $ delimiters)
      const trimmed = html.trim();
      if (!trimmed.startsWith('\\(') && !trimmed.startsWith('\\[')) {
        html = `\\(${trimmed}\\)`;
      }
    }

    // Extract style properties
    const textColor = (Array.isArray(style) ? style[0] : style)?.color || '#1E293B';
    const fontSize = (Array.isArray(style) ? style[0] : style)?.fontSize || 15;
    const fontWeight = (Array.isArray(style) ? style[0] : style)?.fontWeight || '400';
    const lineHeight = (Array.isArray(style) ? style[0] : style)?.lineHeight || 22;

    // Create HTML with MathJax
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
          <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['\\\\(', '\\\\)']],
                displayMath: [['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
                ignoreHtmlClass: 'tex2jax_ignore',
                processHtmlClass: 'tex2jax_process'
              }
            };
          </script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
            body {
              padding: 4px 8px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: ${fontSize}px;
              line-height: ${lineHeight}px;
              color: ${textColor};
              font-weight: ${fontWeight};
              word-wrap: break-word;
              overflow-wrap: break-word;
              -webkit-text-size-adjust: 100%;
            }
            .MathJax {
              font-size: 1em !important;
            }
            .MathJax_Display {
              margin: 0.5em 0 !important;
            }
            #content {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div id="content">${html}</div>
          <script>
            (function() {
              function updateHeight() {
                var height = Math.max(
                  document.body.scrollHeight,
                  document.body.offsetHeight,
                  document.documentElement.clientHeight,
                  document.documentElement.scrollHeight,
                  document.documentElement.offsetHeight
                );
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
                }
              }
              
              function renderMath() {
                if (window.MathJax && window.MathJax.typesetPromise) {
                  window.MathJax.typesetPromise(['#content']).then(function() {
                    updateHeight();
                  }).catch(function (err) {
                    console.error('MathJax rendering error:', err);
                    updateHeight();
                  });
                } else {
                  setTimeout(renderMath, 100);
                }
              }
              
              // Initial height update
              setTimeout(updateHeight, 50);
              renderMath();
            })();
          </script>
        </body>
      </html>
    `;

    return { processedHTML: fullHTML, hasMath: true };
  }, [children, style]);

  // If no math expressions, render as plain text for better performance
  if (!hasMath) {
    return (
      <Text style={style}>
        {children}
      </Text>
    );
  }

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.height > 0) {
        setWebViewHeight(data.height);
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  return (
    <View style={[{ overflow: 'hidden', flex: 1 }, containerStyle]}>
      <WebView
        source={{ html: processedHTML }}
        style={{
          backgroundColor: 'transparent',
          width: '100%',
          height: Math.max(webViewHeight, 40),
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        originWhitelist={['*']}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

