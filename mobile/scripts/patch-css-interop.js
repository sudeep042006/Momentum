const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'dist', 'runtime', 'native', 'render-component.js');

try {
  if (fs.existsSync(target)) {
    let content = fs.readFileSync(target, 'utf8');
    if (content.includes('JSON.stringify(object, function replace(key, value)') || !content.includes('return "[Props]";')) {
      content = content.replace(
        /function printUpgradeWarning\(warning, originalProps\) \{[\s\S]*?function stringify\(object\) \{[\s\S]*?\n\}/,
        `function printUpgradeWarning(warning, originalProps) {
    try {
        console.warn(\`CssInterop upgrade warning.\\n\\n\${warning}\\n\`);
    } catch (e) {
        // Safe fail-safe
    }
}
function stringify(object) {
    return "[Props]";
}`
      );
      fs.writeFileSync(target, content, 'utf8');
      console.log('[Momentum] Successfully patched react-native-css-interop/render-component.js');
    } else {
      console.log('[Momentum] react-native-css-interop is already patched.');
    }
  }
} catch (err) {
  console.warn('[Momentum] Could not patch react-native-css-interop:', err.message);
}
