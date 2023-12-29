import * as marticleParser from './marticleParser';
import { expect } from 'chai';
import { VideoType } from '../model';
import { MarticleComponent } from './marticleTypes';

/**
 * Returns data in the format of an API response from the legacy Parser service.
 * @param html
 * @param images
 * @param url
 */
function getTestArticle(html, images?, url?) {
  return {
    isArticle: true,
    isVideo: false,
    article: html,
    images: images ?? {
      1: {
        image_id: '1',
        width: 200,
        height: 150,
        src: 'https://imagine.a-cool.image.jpg',
        caption: 'I told you this is a cool image',
        credit: 'give it all to kelvin',
      },
    },
    givenUrl: url ?? 'https://something-to.test',
  };
}

describe('MarticleParser', () => {
  it('should parse all text', () => {
    // TODO: when images are not formatted properly, transform into an Unmarsable component.
    // {
    //   __typeName: 'UnMarseable',
    //   content: '<img src=https://123/>'
    // }
    const input =
      '<p>A paragraph with an <b>image</b><img src="https://123"/></p><h1>heading</h1><p>Another paragraph with some <em>em</em> text</p>';
    const res = marticleParser.parseArticle(getTestArticle(input));
    const expected = [
      {
        __typeName: 'MarticleText',
        content: 'A paragraph with an **image**',
      },
      {
        __typeName: 'MarticleText',
        content: 'Another paragraph with some _em_ text',
      },
    ];
    // TODO: Fix https://www.chaijs.com/plugins/chai-include-ordered-with-gaps/
    // or make own plugin, to test ordering
    expect(res).to.deep.include.members(expected);
  });

  it('should parse text only html', () => {
    const input =
      '<p>A top-level paragraph</p><p>Another top-level paragraph. <i>No</i> special components</p>';
    const res = marticleParser.parseArticle(getTestArticle(input));
    const expected = [
      { __typeName: 'MarticleText', content: 'A top-level paragraph' },
      {
        __typeName: 'MarticleText',
        content: 'Another top-level paragraph. _No_ special components',
      },
    ];
    expect(res).to.deep.equal(expected);
  });

  it('should parse headings', () => {
    const input =
      '<h1>A heading</h1><p>A paragraph</p><h2>A <b>formatted</b> heading</h2><h6>An h6</h6><h4>A <a href=/link>linked</a> h4</h4><h5>An h5</h5><h3>An h3</h3>';
    const res = marticleParser.parseArticle(
      getTestArticle(input),
    ) as MarticleComponent[];
    const expected = [
      { __typeName: 'MarticleHeading', content: '# A heading', level: 1 },
      {
        __typeName: 'MarticleHeading',
        content: '## A **formatted** heading',
        level: 2,
      },
      {
        __typeName: 'MarticleHeading',
        content: '###### An h6',
        level: 6,
      },
      {
        __typeName: 'MarticleHeading',
        content: '#### A [linked](/link) h4',
        level: 4,
      },
      {
        __typeName: 'MarticleHeading',
        content: '##### An h5',
        level: 5,
      },
      {
        __typeName: 'MarticleHeading',
        content: '### An h3',
        level: 3,
      },
    ];
    expect(res.length).to.equal(7);
    expect(res[1].__typeName).to.equal('MarticleText');
    // TODO: Test ordering
    expect(res).to.deep.include.members(expected);
  });

  it('should parse horizontal rules/content dividers', () => {
    const input = '<hr><p>Some text</p><hr><hr><p>A paragraph</p><hr>';
    const res = marticleParser.parseArticle(getTestArticle(input));
    const expected = [
      { __typeName: 'MarticleDivider', content: '---' },
      {
        __typeName: 'MarticleText',
        content: 'Some text',
      },
      { __typeName: 'MarticleDivider', content: '---' },
      { __typeName: 'MarticleDivider', content: '---' },
      {
        __typeName: 'MarticleText',
        content: 'A paragraph',
      },
      { __typeName: 'MarticleDivider', content: '---' },
    ];
    expect(res).to.deep.equal(expected);
  });

  it('should parse tables', () => {
    const input =
      '<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>c</td><td>d</td></tr></tbody></table>';
    const res = marticleParser.parseArticle(getTestArticle(input));
    const expected = [{ __typeName: 'MarticleTable', html: input }];
    expect(res).to.deep.equal(expected);
  });

  it('should parse codeblocks with a code tag', () => {
    const input =
      '<pre><code>p { color: red; }\nbody { background-color: #eee; }\n</code></pre>';
    const res = marticleParser.parseArticle(getTestArticle(input));
    const expected = [
      {
        __typeName: 'MarticleCodeBlock',
        text: 'p { color: red; }\nbody { background-color: #eee; }\n',
      },
    ];
    expect(res).to.deep.equal(expected);
  });

  it('should parse unordered list', () => {
    const input =
      '<ul>' +
      '    <li>Coffee</li>' +
      '    <li>Tea' +
      '    <ul>' +
      '      <li>BlackTea</li>' +
      '      <li>GreenTea</li>' +
      '    </ul>' +
      '  </li>' +
      '  <li>Milk</li>' +
      '</ul>';
    const minified = input.replace(/\s+/g, '');
    const res = marticleParser.parse(minified);
    const expected = [
      {
        __typeName: 'MarticleBulletedList',
        rows: [
          {
            level: 0,
            content: 'Coffee',
          },
          {
            level: 0,
            content: 'Tea',
          },
          {
            level: 1,
            content: 'BlackTea',
          },
          {
            level: 1,
            content: 'GreenTea',
          },
          {
            level: 0,
            content: 'Milk',
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse with correct indices if there are newlines between list elements, and remove the newlines', () => {
    const input = `<ol nodeIndex="11"><li nodeIndex="10">Compiler warnings are bad.</li>\n<li nodeIndex="12">Having lots of them is demoralizing.</li>\n<li nodeIndex="13">If we had prevented them from ever occurring we wouldn't be in this mess.</li>\n</ol>`;
    const res = marticleParser.parse(input);
    const expected = [
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 0,
            level: 0,
            content: 'Compiler warnings are bad.',
          },
          {
            index: 1,
            level: 0,
            content: 'Having lots of them is demoralizing.',
          },
          {
            index: 2,
            level: 0,
            content: `If we had prevented them from ever occurring we wouldn't be in this mess.`,
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse ordered list indices correctly if there is an intervening element', () => {
    const input =
      '<ol>' +
      '    <li>Coffee</li>' +
      '    <li>Tea' +
      '    <ol>' +
      '      <li>BlackTea</li>' +
      '      <li><h1>illegalHeading</h1></li>' +
      '    </ol>' +
      '  </li>' +
      '  <li>Milk</li>' +
      '</ol>';
    const minified = input.replace(/\s+/g, '');
    const res = marticleParser.parse(minified);
    const expected = [
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            level: 0,
            index: 0,
            content: 'Coffee',
          },
          {
            level: 0,
            index: 1,
            content: 'Tea',
          },
          {
            level: 1,
            index: 0,
            content: 'BlackTea',
          },
        ],
      },
      {
        __typeName: 'MarticleHeading',
        level: 1,
        content: '# illegalHeading',
      },
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            level: 0,
            index: 2,
            content: 'Milk',
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });

  it('should parse ordered list', () => {
    const input =
      '<ol>' +
      '    <li>Coffee</li>' +
      '    <li>Tea' +
      '    <ol>' +
      '      <li>BlackTea</li>' +
      '      <li>GreenTea</li>' +
      '    </ol>' +
      '  </li>' +
      '  <li>Milk</li>' +
      '</ol>';
    const minified = input.replace(/\s+/g, '');
    const res = marticleParser.parse(minified);
    const expected = [
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 0,
            level: 0,
            content: 'Coffee',
          },
          {
            index: 1,
            level: 0,
            content: 'Tea',
          },
          {
            index: 0,
            level: 1,
            content: 'BlackTea',
          },
          {
            index: 1,
            level: 1,
            content: 'GreenTea',
          },
          {
            index: 2,
            level: 0,
            content: 'Milk',
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse nested ordered list', () => {
    const input =
      '<ul>' +
      '    <li>Coffee</li>' +
      '    <li>Tea' +
      '    <ol>' +
      '      <li>BlackTea</li>' +
      '      <li>Green<em>Tea</em></li>' +
      '    </ol>' +
      '  </li>' +
      '  <li>Milk</li>' +
      '</ul>';
    const minified = input.replace(/\s+/g, '');
    const res = marticleParser.parse(minified);
    const expected = [
      {
        __typeName: 'MarticleBulletedList',
        rows: [
          {
            level: 0,
            content: 'Coffee',
          },
          {
            level: 0,
            content: 'Tea',
          },
        ],
      },
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 0,
            level: 1,
            content: 'BlackTea',
          },
          {
            index: 1,
            level: 1,
            content: 'Green_Tea_',
          },
        ],
      },
      {
        __typeName: 'MarticleBulletedList',
        rows: [
          {
            level: 0,
            content: 'Milk',
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse nested unordered lists', () => {
    const input =
      '<ol>' +
      '    <li>Coffee</li>' +
      '    <li>Tea' +
      '    <ul>' +
      '      <li>BlackTea</li>' +
      '      <li>GreenTea</li>' +
      '    </ul>' +
      '  </li>' +
      '  <li>Milk</li>' +
      '</ol>';
    const minified = input.replace(/\s+/g, '');
    const res = marticleParser.parse(minified);
    const expected = [
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 0,
            level: 0,
            content: 'Coffee',
          },
          {
            index: 1,
            level: 0,
            content: 'Tea',
          },
        ],
      },
      {
        __typeName: 'MarticleBulletedList',
        rows: [
          {
            level: 1,
            content: 'BlackTea',
          },
          {
            level: 1,
            content: 'GreenTea',
          },
        ],
      },
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 2,
            level: 0,
            content: 'Milk',
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse multiple levels of nesting lists', () => {
    const input =
      '<ol>' +
      '    <li>Coffee</li>' +
      '    <li><b>Tea</b>' +
      '    <ul>' +
      '      <li>BlackTea' +
      '        <ol>' +
      '          <li>GreenTea</li>' +
      '        </ol>' +
      '      </li> ' +
      '    </ul>' +
      '  </li>' +
      '  <li>Milk</li>' +
      '</ol>';
    const minified = input.replace(/\s+/g, '');
    const res = marticleParser.parse(minified);
    const expected = [
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 0,
            level: 0,
            content: 'Coffee',
          },
          {
            index: 1,
            level: 0,
            content: '**Tea**',
          },
        ],
      },
      {
        __typeName: 'MarticleBulletedList',
        rows: [
          {
            level: 1,
            content: 'BlackTea',
          },
        ],
      },
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 0,
            level: 2,
            content: 'GreenTea',
          },
        ],
      },
      {
        __typeName: 'MarticleNumberedList',
        rows: [
          {
            index: 2,
            level: 0,
            content: 'Milk',
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse lists with a marticle component inside', () => {
    const input =
      '<ul>' +
      '    <li>Coffee</li>' +
      '    <li>Tea' +
      '    <ul>' +
      '      <li>BlackTea</li>' +
      '      <li><h1>illegalHeading</h1></li>' +
      '    </ul>' +
      '  </li>' +
      '  <li>Milk</li>' +
      '</ul>';
    const minified = input.replace(/\s+/g, '');
    const res = marticleParser.parse(minified);
    const expected = [
      {
        __typeName: 'MarticleBulletedList',
        rows: [
          {
            level: 0,
            content: 'Coffee',
          },
          {
            level: 0,
            content: 'Tea',
          },
          {
            level: 1,
            content: 'BlackTea',
          },
        ],
      },
      {
        __typeName: 'MarticleHeading',
        level: 1,
        content: '# illegalHeading',
      },
      {
        __typeName: 'MarticleBulletedList',
        rows: [
          {
            level: 0,
            content: 'Milk',
          },
        ],
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse videos', () => {
    const input =
      '<p>A paragraph with a <b>video</b>' +
      '<div><!--VIDEO_1--></div>' +
      '<p>Another paragraph with a <b> second video</b>' +
      '<div><!--VIDEO_2--></div>';

    const baseVideo = {
      width: 200,
      height: 150,
      vid: 'wubbalubbadubdub',
      length: '10',
      type: '1',
    };

    const article = {
      isArticle: true,
      isVideo: false,
      article: input,
      videos: {
        1: {
          ...baseVideo,
          video_id: '1',
          src: 'https://imagine.a-cool.video',
        },
        2: {
          ...baseVideo,
          height: '',
          width: '',
          video_id: '2',
          src: 'https://imagine.another-cool.video',
        },
      },
      givenUrl: 'https://something-to.test',
    };

    const res = marticleParser.parseArticle(article);

    const expected = [
      {
        __typeName: 'MarticleText',
        content: 'A paragraph with a **video**',
      },
      {
        __typeName: 'Video',
        ...baseVideo,
        type: VideoType.YOUTUBE,
        videoId: 1,
        src: 'https://imagine.a-cool.video',
        video_id: '1',
      },
      {
        __typeName: 'MarticleText',
        content: 'Another paragraph with a **second video**',
      },
      {
        __typeName: 'Video',
        ...baseVideo,
        type: VideoType.YOUTUBE,
        videoId: 2,
        width: null,
        height: null,
        src: 'https://imagine.another-cool.video',
        video_id: '2',
      },
    ];
    expect(res).to.deep.equal(expected);
  });

  it('should parse images', () => {
    const input =
      '<p>A paragraph with an <b>image</b>' +
      '<div><!--IMG_1--></div>' +
      '<p>Another paragraph with a <b> second image</b>' +
      '<div><!--IMG_2--></div>';

    const baseImage = {
      width: 200,
      height: 150,
      caption: 'I told you this is a cool image',
      credit: 'give it all to kelvin',
    };

    const article = {
      isArticle: true,
      article: input,
      isVideo: false,
      images: {
        1: {
          ...baseImage,
          image_id: '1',
          src: 'https://imagine.a-cool.image.jpg',
        },
        2: {
          ...baseImage,
          width: '',
          image_id: '2',
          src: 'https://imagine.another-cool.image.jpg',
        },
      },
      givenUrl: 'https://something-to.test',
    };

    const res = marticleParser.parseArticle(article);

    const expected = [
      {
        __typeName: 'MarticleText',
        content: 'A paragraph with an **image**',
      },
      {
        __typeName: 'Image',
        ...baseImage,
        imageId: 1,
        src: 'https://imagine.a-cool.image.jpg',
        image_id: '1',
        targetUrl: null,
      },
      {
        __typeName: 'MarticleText',
        content: 'Another paragraph with a **second image**',
      },
      {
        __typeName: 'Image',
        ...baseImage,
        width: null,
        imageId: 2,
        src: 'https://imagine.another-cool.image.jpg',
        image_id: '2',
        targetUrl: null,
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should process a blockquote with text only', () => {
    const input = '<blockquote>this is an insightful quote</blockquote>';
    const expected = [
      {
        __typeName: 'MarticleBlockquote',
        content: 'this is an insightful quote',
      },
    ];
    const res = marticleParser.parse(input);
    expect(res).to.deep.equal(expected);
  });
  it('should process a blockquote with multiple paragraphs', () => {
    const input =
      '<blockquote><p>this <em>insightful</em> quote</p><p>has multiple paragraphs</p></blockquote>';
    const expected = [
      {
        __typeName: 'MarticleBlockquote',
        content: 'this _insightful_ quote',
      },
      {
        __typeName: 'MarticleBlockquote',
        content: 'has multiple paragraphs',
      },
    ];
    const res = marticleParser.parse(input);
    expect(res).to.deep.equal(expected);
  });
  it('should process a blockquote with paragraphs and text nodes', () => {
    const input =
      '<blockquote><p>this <em>insightful</em> quote</p><p>has multiple paragraphs</p>and <b>naked</b> text</blockquote>';
    const res = marticleParser.parse(input);
    const expected = [
      {
        __typeName: 'MarticleBlockquote',
        content: 'this _insightful_ quote',
      },
      {
        __typeName: 'MarticleBlockquote',
        content: 'has multiple paragraphs',
      },
      {
        __typeName: 'MarticleBlockquote',
        content: 'and **naked** text',
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should process a blockquote with other paragraphs', () => {
    const input =
      '<p>a paragraph</p><blockquote><p>bq 1</p><p>bq 2</p></blockquote><p>a final paragraph</p>';
    const expected = [
      {
        __typeName: 'MarticleText',
        content: 'a paragraph',
      },
      {
        __typeName: 'MarticleBlockquote',
        content: 'bq 1',
      },
      {
        __typeName: 'MarticleBlockquote',
        content: 'bq 2',
      },
      {
        __typeName: 'MarticleText',
        content: 'a final paragraph',
      },
    ];
    const res = marticleParser.parse(input);
    expect(res).to.deep.equal(expected);
  });
  it('should separate a blockquote containing immediate component', () => {
    const input = '<blockquote>bq 1<hr>bq 2 <b>some text</b></blockquote>';
    const expected = [
      {
        __typeName: 'MarticleBlockquote',
        content: 'bq 1',
      },
      {
        __typeName: 'MarticleDivider',
        content: '---',
      },
      {
        __typeName: 'MarticleBlockquote',
        content: 'bq 2 **some text**',
      },
    ];
    const res = marticleParser.parse(input);
    expect(res).to.deep.equal(expected);
  });
  it('should parse text in <div> tags without a <p> tag, with a rightmost sibling eventual component', () => {
    const input =
      '<div  lang="en">The new October issue of <span>Science</span> #Immunology is out! More to come: https://t.co/dvNsyTHvAs<blockquote>something</blockquote></div>';
    const res = marticleParser.parse(input);
    const expected = [
      {
        __typeName: 'MarticleText',
        content:
          'The new October issue of Science #Immunology is out! More to come: https://t.co/dvNsyTHvAs',
      },
      {
        __typeName: 'MarticleBlockquote',
        content: 'something',
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse text nodes in div, with a leftmost sibling eventual component', () => {
    const input =
      '<div  lang="en"><blockquote>something</blockquote>The new October issue of <span>Science</span> #Immunology is out! More to come: https://t.co/dvNsyTHvAs</div>';
    const res = marticleParser.parse(input);
    const expected = [
      {
        __typeName: 'MarticleBlockquote',
        content: 'something',
      },
      {
        __typeName: 'MarticleText',
        content:
          'The new October issue of Science #Immunology is out! More to come: https://t.co/dvNsyTHvAs',
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse text in <div> tags with no additional components', () => {
    const input =
      '<div  lang="en">The new October issue of <span>Science</span> #Immunology is out! More to come: https://t.co/dv_Ns_yTHvAs</div>';
    const res = marticleParser.parse(input);
    const expected = [
      {
        __typeName: 'MarticleText',
        content:
          'The new October issue of Science #Immunology is out! More to come: https://t.co/dv\\_Ns\\_yTHvAs',
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should parse text in div tags with immediate components', () => {
    const input =
      '<div  lang="en">The new October issue of <span>Science</span> #Immunology is out! More to come: https://t.co/dvNsyTHvAs<h1>title</h1></div>';
    const res = marticleParser.parse(input);
    const expected = [
      {
        __typeName: 'MarticleText',
        content:
          'The new October issue of Science #Immunology is out! More to come: https://t.co/dvNsyTHvAs',
      },
      { __typeName: 'MarticleHeading', content: '# title', level: 1 },
    ];
    expect(res).to.deep.equal(expected);
  });

  it('should parse text in <div> tags with multiple eventual components', () => {
    const input =
      '<div>The new <em>October</em> issue<p>of Science #Immunology<blockquote>is out!</blockquote>More</p>to come:  https://t.co/dvNsyTHvAs</div>';
    const res = marticleParser.parse(input);
    const expected = [
      { __typeName: 'MarticleText', content: 'The new _October_ issue' },
      { __typeName: 'MarticleText', content: 'of Science #Immunology' },
      { __typeName: 'MarticleBlockquote', content: 'is out!' },
      { __typeName: 'MarticleText', content: 'More' },
      {
        __typeName: 'MarticleText',
        content: 'to come: https://t.co/dvNsyTHvAs',
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should handle divs in divs', () => {
    const input =
      '<div>this div<div>has another div<p>with <em>a</em> paragraph<div>why not another div</div>ok?</p>and text</div><blockquote>and blockquote</blockquote>and more text</div>';
    const res = marticleParser.parse(input);
    const expected = [
      { __typeName: 'MarticleText', content: 'this div' },
      { __typeName: 'MarticleText', content: 'has another div' },
      { __typeName: 'MarticleText', content: 'with _a_ paragraph' },
      { __typeName: 'MarticleText', content: 'why not another div' },
      { __typeName: 'MarticleText', content: 'ok?' },
      { __typeName: 'MarticleText', content: 'and text' },
      { __typeName: 'MarticleBlockquote', content: 'and blockquote' },
      { __typeName: 'MarticleText', content: 'and more text' },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should handle images in links', () => {
    const input =
      '<div>some text<div><a href=/url><!--IMG_1!--></a></div>whatever more</div>';
    const baseImage = {
      width: 200,
      height: 150,
      caption: 'uh oh an image link',
      credit: 'thanks',
    };

    const article = {
      isArticle: true,
      isVideo: false,
      article: input,
      images: {
        1: {
          ...baseImage,
          image_id: '1',
          src: 'https://imagine.a-cool.image.jpg',
        },
      },
      givenUrl: 'https://something-to.test',
    };
    const res = marticleParser.parseArticle(article);
    const expected = [
      { __typeName: 'MarticleText', content: 'some text' },
      {
        __typeName: 'Image',
        ...baseImage,
        imageId: 1,
        src: 'https://imagine.a-cool.image.jpg',
        image_id: '1',
        targetUrl: '/url',
      },
      { __typeName: 'MarticleText', content: 'whatever more' },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for audio elements', () => {
    const input =
      '<audio controls="" src="/media/cc0-audio/t-rex-roar.mp3">Your browser does not support the <code>audio</code> element.</audio>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for iframe elements', () => {
    const input =
      '<iframe id="inlineFrameExample" width="300" height="200" src="https://getpocket.com"></iframe>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for definition lists', () => {
    const input =
      '<dl><dt>Beast of Bodmin</dt><dd>A large feline inhabiting Bodmin Moor.</dd></dl>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for script elements', () => {
    const input = '<script>alert("Hello World!");</script>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for math elements', () => {
    const input = '<math><mrow><msup><mi>a</mi><mn>2</mn></msup></mrow></math>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for details elements', () => {
    const input =
      '<details><summary>Details</summary>Something small enough to escape casual notice.</details>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for dialog elements', () => {
    const input = '<dialog open=""><p>Greetings, one and all!</p></dialog>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for menu elements', () => {
    const input =
      '<menu><button id="updateDetails">Update details</button></menu>';
    const res = marticleParser.parse(input);
    const expected = [{ __typeName: 'UnMarseable', html: input }];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for Videos without a valid src (empty/null/undefined/malformed)', () => {
    const input =
      '<p>A paragraph with a <b>video</b>' +
      '<div><!--VIDEO_1--></div>' +
      '<p>Another paragraph with a <b> second video</b>' +
      '<div><!--VIDEO_2--></div>' +
      '<div><!--VIDEO_3--></div>';

    const baseVideo = {
      width: 200,
      height: 150,
      vid: 'wubbalubbadubdub',
      length: '10',
      type: '1',
    };

    const article = {
      isArticle: true,
      isVideo: false,
      article: input,
      videos: {
        1: {
          ...baseVideo,
          video_id: '1',
          src: '', // empty string
        },
        2: {
          ...baseVideo,
          height: '',
          width: '',
          video_id: '2',
          // src is null or undefined
        },
        3: {
          ...baseVideo,
          height: '',
          width: '',
          video_id: '3',
          src: 'https://a_url.mpeg https://why_arethere_two.mpeg', //malformed
        },
      },
      givenUrl: 'https://something-to.test',
    };

    const res = marticleParser.parseArticle(article);

    const expected = [
      {
        __typeName: 'MarticleText',
        content: 'A paragraph with a **video**',
      },
      {
        __typeName: 'UnMarseable',
        html: '<div><p>This video could not be shown.</p></div>',
      },
      {
        __typeName: 'MarticleText',
        content: 'Another paragraph with a **second video**',
      },
      {
        __typeName: 'UnMarseable',
        html: '<div><p>This video could not be shown.</p></div>',
      },
      {
        __typeName: 'UnMarseable',
        html: '<div><p>This video could not be shown.</p></div>',
      },
    ];
    expect(res).to.deep.equal(expected);
  });
  it('should return UnMarseable for Images without a valid src (empty/null/undefined/malformed)', () => {
    const input =
      '<p>A paragraph with an <b>image</b>' +
      '<div><!--IMG_1--></div>' +
      '<p>Another paragraph with a <b> second image</b>' +
      '<div><!--IMG_2--></div>' +
      '<div><!--IMG_3--></div>';

    const baseImage = {
      width: 200,
      height: 150,
      caption: 'I told you this is a cool image',
      credit: 'give it all to kelvin',
    };

    const article = {
      isArticle: true,
      isVideo: false,
      article: input,
      images: {
        1: {
          ...baseImage,
          image_id: '1',
          src: '', // src empty string
        },
        2: {
          ...baseImage,
          width: '',
          image_id: '2',
          // src missing/null
        },
        3: {
          ...baseImage,
          width: '',
          image_id: '2',
          src: 'https://a_url.png https://why_arethere_two.jpg', //malformed
        },
      },
      givenUrl: 'https://something-to.test',
    };

    const res = marticleParser.parseArticle(article);

    const expected = [
      {
        __typeName: 'MarticleText',
        content: 'A paragraph with an **image**',
      },
      {
        __typeName: 'UnMarseable',
        html: '<div><p>This image could not be shown.</p></div>',
      },
      {
        __typeName: 'MarticleText',
        content: 'Another paragraph with a **second image**',
      },
      {
        __typeName: 'UnMarseable',
        html: '<div><p>This image could not be shown.</p></div>',
      },
      {
        __typeName: 'UnMarseable',
        html: '<div><p>This image could not be shown.</p></div>',
      },
    ];
    expect(res).to.deep.equal(expected);
  });
});
