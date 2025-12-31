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

  // Convert matrix notation [[...], [...]] to LaTeX format
  const convertMatrixToLatex = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    // Find all potential matrix patterns by matching balanced brackets
    // Pattern: [[...], [...], ...] where we have nested arrays
    const findBalancedBrackets = (str: string, startPos: number): number | null => {
      let depth = 0;
      let i = startPos;
      
      while (i < str.length) {
        if (str[i] === '[') {
          depth++;
        } else if (str[i] === ']') {
          depth--;
          if (depth === 0) {
            return i;
          }
        }
        i++;
      }
      
      return null;
    };
    
    let result = text;
    let i = 0;
    let lastReplacementEnd = -1;
    
    // Process from left to right, but track replacements to avoid overlapping
    while (i < result.length - 1) {
      // Skip if we're within a previous replacement
      if (i <= lastReplacementEnd) {
        i++;
        continue;
      }
      
      // Look for the start of a potential matrix: [[
      if (result[i] === '[' && result[i + 1] === '[') {
        const endPos = findBalancedBrackets(result, i);
        
        if (endPos !== null && endPos > i + 2) {
          const candidate = result.substring(i, endPos + 1);
          
          // Try to parse as JSON to validate it's a valid matrix
          try {
            const matrix = JSON.parse(candidate);
            
            if (Array.isArray(matrix) && matrix.length > 0 && Array.isArray(matrix[0])) {
              // Convert to LaTeX matrix format
              const rows = matrix.map((row: any[]) => {
                if (!Array.isArray(row)) return '';
                return row.map((cell: any) => {
                  // Convert cell to string, handle negative numbers and variables
                  const cellStr = String(cell).trim();
                  return cellStr;
                }).join(' & ');
              }).filter((row: string) => row.length > 0);
              
              if (rows.length > 0) {
                const latexMatrix = `\\begin{pmatrix} ${rows.join(' \\\\ ')} \\end{pmatrix}`;
                const replacement = `$${latexMatrix}$`;
                
                // Replace the matrix
                result = result.substring(0, i) + replacement + result.substring(endPos + 1);
                
                // Track where we made the replacement
                lastReplacementEnd = i + replacement.length - 1;
                
                // Move past the replacement
                i += replacement.length;
                continue;
              }
            }
          } catch (e) {
            // Not a valid matrix, continue searching
          }
        }
      }
      
      i++;
    }
    
    return result;
  };

  // Process the text to convert LaTeX to MathJax format
  const { processedHTML, hasMath } = useMemo(() => {
    if (!children) return { processedHTML: '', hasMath: false };

    let html = String(children);
    const originalHtml = html;

    // First, convert matrix notation to LaTeX
    // Store original to check if conversion happened
    const beforeMatrixConversion = html;
    html = convertMatrixToLatex(html);
    const matrixWasConverted = html !== beforeMatrixConversion;

    // Check if text contains LaTeX expressions
    // Check for $ delimiters OR LaTeX commands (like \frac, \text, \sqrt, etc.)
    const hasDollarDelimiters = /\$[^$]+\$/.test(html);
    // Detect LaTeX commands: \command{...}, \command, or special symbols like \alpha, \pi, etc.
    const hasLatexCommands = /\\[a-zA-Z]+\{/.test(html) || 
                             /\\[a-zA-Z]+ /.test(html) || 
                             /\\[^a-zA-Z\s]/.test(html) ||
                             /\\text/.test(html) ||
                             /\\frac/.test(html) ||
                             /\\sqrt/.test(html) ||
                             /\\begin\{pmatrix\}/.test(html) || // Check for matrices
                             /\\begin\{matrix\}/.test(html) || // Check for other matrix types
                             /\\end\{pmatrix\}/.test(html); // Check for matrix endings
    // Also check if we converted a matrix (even if regex doesn't catch it)
    const containsMath = hasDollarDelimiters || hasLatexCommands || matrixWasConverted;
    
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
                processEnvironments: true,
                packages: {'[+]': ['ams', 'base']}
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

