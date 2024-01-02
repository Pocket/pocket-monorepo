import TurndownService from 'turndown';

const turndownService = new TurndownService({ headingStyle: 'atx' });

turndownService.addRule('image', {
  filter: ['img'],
  replacement: (content) => '',
});

turndownService.addRule('divider', {
  filter: ['hr'],
  replacement: (content) => '',
});

turndownService.addRule('table', {
  filter: ['table'],
  replacement: (content) => '',
});

turndownService.addRule('code_block', {
  filter: function (node, options) {
    return node.nodeName === 'PRE' && node.firstChild.nodeName === 'CODE';
  },
  replacement: (content) => '',
});

turndownService.addRule('unordered_list', {
  filter: ['ul'],
  replacement: (content) => '',
});

turndownService.addRule('ordered_list', {
  filter: ['ol'],
  replacement: (content) => '',
});

// Image and video links are handled by Marticle components,
// so we want to remove any other links that don't have text
turndownService.addRule('emptyLink', {
  filter: function (node: HTMLElement): boolean {
    return (
      node.nodeName === 'A' && !!node.getAttribute('href') && !node.textContent
    );
  },
  replacement: (content) => {
    return '';
  },
});

export default turndownService;
