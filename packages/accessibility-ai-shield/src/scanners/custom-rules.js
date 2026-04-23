const fs = require('fs');

function makeFinding({ file, line, ruleId, wcagRef, message, suggestedFix }) {
  return { ruleId, wcagRef, severity: 'warn', file, line, message, suggestedFix };
}

function lineNumberAt(content, idx) {
  return content.slice(0, idx).split('\n').length;
}

function findTagEnd(content, startIdx) {
  let idx = startIdx;
  let quote = null;
  let braceDepth = 0;

  while (idx < content.length) {
    const char = content[idx];
    const prev = content[idx - 1];

    if (quote) {
      if (char === quote && prev !== '\\') {
        quote = null;
      }
      idx += 1;
      continue;
    }

    if (char === '"' || char === '\'') {
      quote = char;
      idx += 1;
      continue;
    }

    if (char === '{') {
      braceDepth += 1;
      idx += 1;
      continue;
    }

    if (char === '}') {
      braceDepth = Math.max(braceDepth - 1, 0);
      idx += 1;
      continue;
    }

    if (char === '>' && braceDepth === 0) {
      return idx;
    }

    idx += 1;
  }

  return -1;
}

function findJsxTags(content, tagName) {
  const tags = [];
  const openRe = new RegExp(`<${tagName}\\b`, 'g');
  let match = openRe.exec(content);

  while (match) {
    const start = match.index;
    const end = findTagEnd(content, start);
    if (end !== -1) {
      tags.push({
        start,
        end,
        tag: content.slice(start, end + 1),
        attrs: content.slice(start + match[0].length, end)
      });
      openRe.lastIndex = end + 1;
    }
    match = openRe.exec(content);
  }

  return tags;
}

function isInsideWrappedLabel(content, tagStart) {
  const lastLabelOpen = content.lastIndexOf('<label', tagStart);
  if (lastLabelOpen === -1) return false;

  const lastLabelClose = content.lastIndexOf('</label>', tagStart);
  if (lastLabelClose > lastLabelOpen) return false;

  const nextLabelClose = content.indexOf('</label>', lastLabelOpen);
  return nextLabelClose !== -1 && nextLabelClose > tagStart;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  const imgTags = findJsxTags(content, 'img');
  imgTags.forEach((tag) => {
    const attrs = tag.attrs || '';
    if (!/\balt\s*=/.test(attrs)) {
      findings.push(makeFinding({
        file: filePath,
        line: lineNumberAt(content, tag.start),
        ruleId: 'custom/img-alt-required',
        wcagRef: '1.1.1',
        message: 'Image is missing alternative text.',
        suggestedFix: 'Add an alt attribute describing image purpose (or alt="" for decorative images).'
      }));
    }
  });

  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let match = buttonRegex.exec(content);
  while (match) {
    const attrs = match[1] || '';
    const innerText = (match[2] || '').replace(/<[^>]+>/g, '').trim();
    const hasAccessibleName = /\baria-label\s*=|\baria-labelledby\s*=|\btitle\s*=/.test(attrs) || innerText.length > 0;
    if (!hasAccessibleName) {
      findings.push(makeFinding({
        file: filePath,
        line: lineNumberAt(content, match.index),
        ruleId: 'custom/button-accessible-name',
        wcagRef: '4.1.2',
        message: 'Button has no discernible accessible name.',
        suggestedFix: 'Add visible button text or aria-label/aria-labelledby.'
      }));
    }
    match = buttonRegex.exec(content);
  }

  const inputTags = [
    ...findJsxTags(content, 'input'),
    ...findJsxTags(content, 'select'),
    ...findJsxTags(content, 'textarea')
  ];

  inputTags.forEach((tag) => {
    const attrs = tag.attrs || '';
    if (/type\s*=\s*["']hidden["']/.test(attrs)) {
      return;
    }
    const hasName = /\baria-label\s*=|\baria-labelledby\s*=|\bid\s*=/.test(attrs)
      || isInsideWrappedLabel(content, tag.start);
    if (!hasName) {
      findings.push(makeFinding({
        file: filePath,
        line: lineNumberAt(content, tag.start),
        ruleId: 'custom/form-control-label',
        wcagRef: '1.3.1',
        message: 'Form control may be missing accessible name/association.',
        suggestedFix: 'Add id+<label htmlFor>, or aria-label/aria-labelledby.'
      }));
    }
  });

  const clickRegex = /<([A-Za-z][A-Za-z0-9]*)\b([^>]*)\bonClick\s*=\s*\{[^}]+\}([^>]*)>/g;
  match = clickRegex.exec(content);
  while (match) {
    const tag = match[1].toLowerCase();
    const attrs = `${match[2] || ''} ${match[3] || ''}`;
    const isNativeInteractive = ['button', 'input', 'select', 'textarea'].includes(tag)
      || (tag === 'a' && /\bhref\s*=/.test(attrs));
    const hasKeyboardHandler = /\bonKeyDown\s*=|\bonKeyUp\s*=|\bonKeyPress\s*=/.test(attrs);

    if (!isNativeInteractive && !hasKeyboardHandler) {
      findings.push(makeFinding({
        file: filePath,
        line: lineNumberAt(content, match.index),
        ruleId: 'custom/click-keyboard-parity',
        wcagRef: '2.1.1',
        message: 'Clickable non-interactive element lacks keyboard interaction support.',
        suggestedFix: 'Use a semantic button/link, or add role="button", tabIndex="0", and key handlers.'
      }));
    }
    match = clickRegex.exec(content);
  }

  const iconRegex = /<Icon[A-Za-z0-9_]*\b/g;
  match = iconRegex.exec(content);
  while (match) {
    const end = findTagEnd(content, match.index);
    if (end === -1) {
      match = iconRegex.exec(content);
      // eslint-disable-next-line no-continue
      continue;
    }
    const attrs = content.slice(match.index + match[0].length, end) || '';
    const hasA11y = /\ba11yLabel\s*=|\baria-label\s*=|\baria-labelledby\s*=/.test(attrs);
    if (!hasA11y) {
      findings.push(makeFinding({
        file: filePath,
        line: lineNumberAt(content, match.index),
        ruleId: 'custom/icon-a11y-label',
        wcagRef: '1.1.1',
        message: 'Terra icon is missing a11y label.',
        suggestedFix: 'Add a11yLabel for functional icons; hide decorative icons from assistive tech.'
      }));
    }
    iconRegex.lastIndex = end + 1;
    match = iconRegex.exec(content);
  }

  return findings;
}

function runCustomRuleScan(files) {
  return files.flatMap((file) => scanFile(file));
}

module.exports = {
  runCustomRuleScan
};
