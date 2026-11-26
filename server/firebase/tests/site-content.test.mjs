import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSiteContent } from '../site-content.mjs';

test('curated photo positions and section visibility normalize safely', () => {
  const original = normalizeSiteContent({});
  assert.equal(original.visibility.homeStories, true);
  assert.equal(original.visibility.storiesGallery, true);
  assert.equal(original.media.journeyGreen.imageUrl, '');
  assert.equal(original.media.heroSceneArrival.imageUrl, '');
  assert.equal(original.media.serviceAirport.imageUrl, '');
  assert.equal(original.media.jabalpurHero.imageUrl, '');
  const edited = normalizeSiteContent({
    media: { journeyGreen: { imageUrl: '/api/uploads/11111111-2222-4333-8444-555555555555.webp', alt: 'Reviewed green road vehicle photograph' } },
    visibility: { homeStories: false, storiesGallery: false },
  });
  assert.equal(edited.visibility.homeStories, false);
  assert.equal(edited.visibility.homeJourneys, true);
  assert.equal(edited.media.journeyGreen.alt, 'Reviewed green road vehicle photograph');
  assert.equal(edited.media.homeStoryMountain.imageUrl, '');
  const expanded = normalizeSiteContent({media:{heroSceneArrival:{imageUrl:'/api/uploads/11111111-2222-4333-8444-555555555555.webp',alt:'Approved hero landscape'}}});
  assert.equal(expanded.media.heroSceneArrival.alt,'Approved hero landscape');
});

test('content image placement cannot inject external URLs, arbitrary slots or inaccessible photos', () => {
  const expected = (media, visibility = {}) => assert.throws(() =>
    normalizeSiteContent({ media, visibility }), { status: 422 });
  expected({ journeyGreen: { imageUrl: 'https://example.com/anything.webp', alt: 'External' } });
  expected({ journeyGreen: { imageUrl: 'javascript:alert(1)', alt: 'Unsafe' } });
  expected({ journeyGreen: { imageUrl: '/api/uploads/11111111-2222-4333-8444-555555555555.webp', alt: '' } });
  expected({ arbitraryHtmlWidget: { imageUrl: '', alt: '' } });
  expected({}, { homeStories: 'false' });
  expected({}, { arbitraryHtmlWidget: true });
});
