export function parseXML(handlers, xml) {
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
