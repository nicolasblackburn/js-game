exports.parseXML = function(handlers, xml) {
  const tokens = Object.entries({
    COMMENT: /^<!--.*-->/,
    CLOSETAG: /^<\/\s*([^>\s]+)\s*>/,
    OPENTAG_START: /^<\s*([^<>\s]+)/,
    ATTRIBUTE: /^\s*([^<>\s]+)\s*=\s*("(?:\\"|[^"])*"|'(?:\\'|[^'])*')/,
    OPENTAG_END: /^\s*>/,
    OPENCLOSETAG_END: /^\s*\/>/,
    TEXT: /^[^<]+/,
    WS: /^\s+/,
    NWS: /^[^\s]+/
  });

  while (xml.length) {
    for (const [token, re] of tokens) {
      const result = xml.match(re);
      if (result) {
        handlers[token]?.(...result);
        xml = xml.slice(result[0].length);
        break;
      }
    }
  }
}

exports.parseJS = function(handlers, code) {
  const tokens = Object.entries({
    DOUBLE_SLASH_COMMENT: /^\/\/[^\n\r]*/,
    MULTILINES_COMMENT: /^\/\*[\s\S]*?\*\//,
    CONST_ASSIGNMENT: /^const\s+([^\=\s]+)\s*\=?/,
    FUNCTION_START: /^(?:async\s+)?function\s*\*?(?:\s+([^(]+)?)\s*\([^{]+{/,
    STRING: /^("(?:\\"|[^"])*"|'(?:\\'|[^'])*')/m,
    OPEN_PARENTHESIS: /^\(/,
    CLOSE_PARENTHESIS: /^\)/,
    OPEN_BRACE: /^{/,
    CLOSE_BRACE: /^}/,
    WS: /^\s+/,
    REST: /^[^\s]+/
  });

  while (code.length) {
    for (const [token, re] of tokens) {
      const result = code.match(re);
      if (result) {
        handlers[token]?.(...result);
        code = code.slice(result[0].length);
        break;
      }
    }
  }
}

