const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');

const script = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf8');

function load(html) {
  const { document } = parseHTML(`<html><head><title>Customer reviews: Test product</title></head><body>${html}</body></html>`);
  let listener;
  const context = vm.createContext({
    document,
    location: { href: 'https://www.amazon.com/product-reviews/B0TEST' },
    chrome: { runtime: { onMessage: { addListener(callback) { listener = callback; } } } },
    console
  });
  vm.runInContext(script, context);
  return {
    document,
    reviews: () => vm.runInContext('extractReviews()', context),
    export: () => {
      let response;
      listener({ action: 'extract_reviews' }, {}, value => { response = value; });
      return response;
    }
  };
}

function review(id, metadata, body = 'Smooth shave.<br>Needs replacement blades.') {
  return `<li id="${id}" data-hook="review">
    <span class="a-profile-name">Honest Reviewer</span>
    <a data-hook="review-title"><i data-hook="review-star-rating"><span class="a-icon-alt">3.0 out of 5 stars</span></i>Needs better instructions</a>
    <span data-hook="review-date">Reviewed in the United States on May 6, 2026</span>
    ${metadata}
    <span data-hook="review-body">${body}</span>
  </li>`;
}

// Same badge structure as the uploaded Amazon HTML: the badge is a sibling of the variation link.
const vineMetadata = `<div class="a-row a-spacing-mini review-data review-format-strip">
  <a data-hook="format-strip">Color: Yellow</a>
  <i class="a-icon a-icon-text-separator"></i>
  <span class="a-color-success a-text-bold">Amazon Vine Customer Review of Free Product</span>
  <span class="a-size-mini">( </span>
  <a data-hook="linkless-format-strip-whats-this" href="/gp/vine/help/ref=cm_cr_getr_d">What's this?</a>
  <span class="a-size-mini"> )</span>
</div>`;

test('exports the Vine badge beside the variation without losing review content', () => {
  const page = load(review('RU3HV01NBCBPR', vineMetadata));
  const item = page.reviews()[0];
  assert.equal(item.isVine, true);
  assert.equal(item.reviewBadge, 'Amazon Vine Customer Review of Free Product');
  assert.equal(item.variation, 'Color: Yellow');
  assert.equal(item.title, 'Needs better instructions');
  assert.equal(item.body, 'Smooth shave.\nNeeds replacement blades.');
  const { markdown } = page.export();
  assert.match(markdown, /\*\*Vine Review:\*\* Yes/);
  assert.match(markdown, /\*\*Review Badge:\*\* Amazon Vine Customer Review of Free Product/);
  assert.match(markdown, /\*\*Review ID:\*\* RU3HV01NBCBPR/);
  assert.match(markdown, /May 6, 2026/);
  assert.equal(page.document.querySelector('[data-hook="review-body"] br').tagName, 'BR');
});

test('does not classify a body mention of Vine or a page-level badge as a Vine review', () => {
  const page = load(`<span data-hook="review-vine-strip">Amazon Vine</span>` + review('REGULAR',
    '<div class="review-format-strip"><a data-hook="format-strip">Color: Green</a><span data-hook="avp-badge">Verified Purchase</span></div>',
    'I compared this with an Amazon Vine Customer Review of Free Product.'));
  assert.equal(page.reviews()[0].isVine, false);
  const { markdown } = page.export();
  assert.match(markdown, /\*\*Vine Review:\*\* Not marked/);
  assert.match(markdown, /\*\*Verified Purchase:\*\* Yes/);
});

test('keeps missing review metadata unknown', () => {
  const page = load(review('UNKNOWN', ''));
  assert.equal(page.reviews()[0].isVine, null);
  assert.match(page.export().markdown, /\*\*Vine Review:\*\* Unknown/);
});

test('does not mistake a variation named Vine for a Vine badge', () => {
  const page = load(review('VARIATION', '<div class="review-format-strip"><a data-hook="format-strip"><span>Pattern: Vine</span></a></div>'));
  assert.equal(page.reviews()[0].isVine, false);
});

test('supports the explicit Vine hook and a localized badge with the Vine help link', () => {
  const page = load(
    review('LEGACY', '<span data-hook="review-vine-strip">Amazon Vine Customer Review of Free Product</span>') +
    review('LOCALIZED', '<div class="review-format-strip"><span class="a-color-success a-text-bold">Vine Kundenrezension eines kostenfreien Produkts</span><a href="https://www.amazon.de/gp/vine/help">Was ist das?</a></div>')
  );
  assert.equal(page.reviews()[0].isVine, true);
  assert.equal(page.reviews()[1].isVine, true);
  assert.equal(page.reviews()[1].reviewBadge, 'Vine Kundenrezension eines kostenfreien Produkts');
});

test('exports accurate sample counts and keeps both Vine and regular reviews in the message response', () => {
  const page = load(
    review('VINE', vineMetadata) +
    review('REGULAR', '<div class="review-format-strip"><a data-hook="format-strip">Color: Green</a></div>') +
    review('UNKNOWN', '')
  );
  const response = page.export();
  assert.equal(response.count, 3);
  assert.match(response.markdown, /\*\*Total Reviews:\*\* 3/);
  assert.match(response.markdown, /\*\*Vine Reviews:\*\* 1 \(33\.3% of exported reviews\)/);
  assert.match(response.markdown, /\*\*Reviews Without Vine Badge:\*\* 1/);
  assert.match(response.markdown, /\*\*Unknown Vine Status:\*\* 1/);
  assert.match(response.markdown, /https:\/\/www.amazon.com\/product-reviews\/B0TEST/);
  assert.equal((response.markdown.match(/\*\*Review ID:\*\*/g) || []).length, 3);
});

test('still reports an empty page instead of exporting an empty analysis file', () => {
  assert.equal(load('').export().error, '未识别到评论节点');
});
