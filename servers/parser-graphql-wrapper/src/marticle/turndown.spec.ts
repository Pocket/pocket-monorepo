import turndownService from './turndown';

describe('markdown conversion: ', () => {
  it('does not parse images', () => {
    const html = '<img src="https://try-me"/>';
    const markdown = turndownService.turndown(html);
    expect(markdown).toBe('');
  });
  it('does not parse tables', () => {
    const html =
      '<table><tr><th>Company</th></tr><tr><td>ACME</td></tr></table>';
    const markdown = turndownService.turndown(html);
    expect(markdown).toBe('');
  });
  it('does not parse code blocks', () => {
    const html = '<pre><code>hello world</code></pre>';
    const markdown = turndownService.turndown(html);
    expect(markdown).toBe('');
  });
  it('does not parse dividers', () => {
    const html = '<hr>';
    const markdown = turndownService.turndown(html);
    expect(markdown).toBe('');
  });
  it('does not parse ordered lists', () => {
    const html =
      "<ol><li>I said heeeeeyaaaa</li><ol><li>heeeeyaaaaa</li></ol><li>what's going on?</li></ol>";
    const markdown = turndownService.turndown(html);
    expect(markdown).toBe('');
  });
  it('does not parse unordered lists', () => {
    const html =
      '<ul><li>never gonna give you up</li><li>never gonna let you down</li></ul>';
    const markdown = turndownService.turndown(html);
    expect(markdown).toBe('');
  });
  it('removes empty links', () => {
    const input =
      '<p>a paragraph with an empty link <a href=/url><b></b></a></p>';
    expect(turndownService.turndown(input)).toBe('a paragraph with an empty link');
  });
  it('parses non-empty links', () => {
    const input =
      '<p>a paragraph with a non-empty link <a href=/url><span><b>link me</b></span></a></p>';
    const expected = 'a paragraph with a non-empty link [**link me**](/url)';
    expect(turndownService.turndown(input)).toBe(expected);
  });
});
