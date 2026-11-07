"""Bounded HTTPS check of the owner-private static consultation, not its API server."""
import base64
import getpass
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

HOME_HEADING = 'Le goût d’entreprendre.'
PAGE_TITLES = {'/': HOME_HEADING, '/confidentialite/': 'Données personnelles', '/mentions-legales/': 'Mentions légales'}
PACK_IMAGES = {f'/images/zio-{name}-v2{suffix}.webp' for name in ('hero', 'dining', 'terrace') for suffix in ('', '-mobile')}
FONT_PATHS = {'/fonts/AwesomeSerif-Light.woff2', '/fonts/AwesomeSerif-Regular.woff2', '/fonts/ProximaNova-Regular.woff2', '/fonts/ProximaNova-Semibold.woff2'}
VIDEO_PATH = '/video/zio-cuisine.mp4'
MAX_PAGE_BYTES = 262_144
MAX_ASSET_BYTES = 2_097_152
MAX_VIDEO_BYTES = 67_108_864
MAX_VIDEO_HASH_BYTES = 4_194_304  # Absolute cap if the server ignores a one-byte Range.


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts, self.csp, self.robots, self.headings, self.videos = [], [], [], [], []
        self.forms = self.inputs = 0
        self.images = set()
        self._heading = self._script = None

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.forms += tag == 'form'
        self.inputs += tag in ('input', 'textarea', 'select')
        if tag == 'h1':
            self._heading = []
        if tag == 'script':
            self._script = {'attributes': attributes, 'body': ''}
            self.scripts.append(self._script)
        if tag == 'meta' and attributes.get('http-equiv', '').lower() == 'content-security-policy':
            self.csp.append(attributes.get('content', ''))
        if tag == 'meta' and attributes.get('name', '').lower() == 'robots':
            self.robots.append(attributes.get('content', ''))
        if tag == 'img' and attributes.get('src'):
            self.images.add(attributes['src'])
        if tag in ('img', 'source') and attributes.get('srcset'):
            self.images.update(item.strip().split()[0] for item in attributes['srcset'].split(',') if item.strip())
        if tag == 'video':
            self.videos.append(attributes)

    def handle_endtag(self, tag):
        if tag == 'h1' and self._heading is not None:
            self.headings.append(' '.join(''.join(self._heading).split()))
            self._heading = None
        if tag == 'script':
            self._script = None

    def handle_data(self, data):
        if self._heading is not None:
            self._heading.append(data)
        if self._script is not None:
            self._script['body'] += data


def verify_page(body, route, presentation):
    page = Page()
    page.feed(body)
    assert page.headings == [PAGE_TITLES[route]], f'{route}: expected current single H1'
    assert page.forms == page.inputs == 0, f'{route}: unexpected collection controls'
    assert len(page.csp) == 1, f'{route}: expected one static CSP'
    assert any('noindex' in [item.strip().lower() for item in value.split(',')] for value in page.robots), f'{route}: noindex missing'
    policy = {}
    for directive in page.csp[0].split(';'):
        words = directive.strip().split()
        if words:
            assert words[0] not in policy, f'{route}: duplicate CSP directive'
            policy[words[0]] = words[1:]
    expected = {
        'default-src': ["'none'"], 'style-src': ["'self'"], 'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"], 'base-uri': ["'none'"], 'form-action': ["'none'"],
        'object-src': ["'none'"], 'connect-src': ["'none'"],
    }
    if route == '/':
        assert 'Le formulaire de cette page est en préparation.' in body, 'Closed collection notice missing'
        assert len(page.scripts) == 1, 'Exactly one presentation script is expected'
        script = page.scripts[0]
        assert script['attributes'] == {'id': 'zio-presentation'}, 'Unexpected script attributes or external script'
        assert script['body'] == presentation, 'Presentation script differs from the local source'
        digest = base64.b64encode(hashlib.sha256(presentation.encode()).digest()).decode()
        expected.update({'media-src': ["'self'"], 'script-src': [f"'sha256-{digest}'"]})
        assert PACK_IMAGES <= page.images, 'The six v2 image variants must be referenced'
        assert len(page.videos) == 1, 'Expected one hero video'
        video = page.videos[0]
        assert video.get('data-src') == VIDEO_PATH and 'src' not in video, 'Film must load progressively from the local URL'
        assert video.get('preload') == 'none' and all(key in video for key in ('muted', 'playsinline', 'loop')), 'Unexpected film loading mode'
        # Hero.tsx uses these responsive images below the film as its poster.
        assert {'/images/zio-hero-v2.webp', '/images/zio-hero-v2-mobile.webp'} <= page.images
    else:
        assert not page.scripts and not page.videos, f'{route}: unexpected active presentation'
    assert policy == expected, f'{route}: static CSP differs from the restricted export policy'
    for asset in page.images:
        assert re.fullmatch(r'/images/[A-Za-z0-9_-]+\.(?:webp|svg)', asset), 'Unexpected image origin or path'
    return page


def range_body_limit(status, headers, source_size):
    """Choose a bound from response headers before any body read."""
    assert headers.get('content-encoding', 'identity').lower() == 'identity', 'Unexpected encoded film response'
    if status == 206:
        limit = 1
    elif status == 200:
        assert 0 < source_size <= MAX_VIDEO_HASH_BYTES, 'Server ignored Range and film exceeds the 4 MiB full-read cap'
        limit = source_size
    else:
        raise AssertionError('Film range request did not return 206 or 200')
    declared = headers.get('content-length')
    assert declared is None or (re.fullmatch(r'[0-9]+', declared) and int(declared) == limit), 'Film range response declares an unexpected size'
    return limit


def verify_video(request, source):
    size = source.stat().st_size
    assert 0 < size <= MAX_VIDEO_BYTES, 'Local film exceeds the expected size bound'
    status, headers, _ = request(VIDEO_PATH, method='HEAD', extra={'Accept-Encoding': 'identity'})
    assert status == 200 and headers.get('content-type', '').split(';')[0].strip() == 'video/mp4', 'Film HEAD unavailable or wrong media type'
    assert headers.get('content-encoding', 'identity').lower() == 'identity', 'Unexpected encoded film HEAD'
    declared = headers.get('content-length')
    if declared is not None:
        # A conflicting or malformed declared size is never concealed by a fallback.
        assert re.fullmatch(r'[0-9]+', declared) and int(declared) == size, 'Film HEAD size differs from source'
        return {'path': VIDEO_PATH, 'method': 'HEAD', 'status': status, 'sizeMatchesSource': True, 'contentHashChecked': False}
    status, headers, body = request(VIDEO_PATH, binary=True, limit=1, range_size=size,
                                    extra={'Range': 'bytes=0-0', 'Accept-Encoding': 'identity'})
    assert headers.get('content-type', '').split(';')[0].strip() == 'video/mp4', 'Film range response has wrong media type'
    limit = range_body_limit(status, headers, size)
    assert len(body) == limit, 'Film range body has an unexpected size'
    if status == 206:
        assert headers.get('content-range', '').strip() == f'bytes 0-0/{size}', 'Film Content-Range differs from source size'
        with source.open('rb') as local:
            assert body == local.read(1), 'Film first byte differs from source'
        return {'path': VIDEO_PATH, 'method': 'HEAD+GET-range', 'status': status, 'sizeMatchesSource': True, 'firstByteMatchesSource': True, 'contentHashChecked': False}
    # Only the same GET response is consumed: no second film request or unbounded read.
    assert not headers.get('content-range'), 'Unexpected Content-Range on a full film response'
    assert hashlib.sha256(body).digest() == hashlib.sha256(source.read_bytes()).digest(), 'Film content differs from source'
    return {'path': VIDEO_PATH, 'method': 'HEAD+GET-bounded', 'status': status, 'rangeHonored': False, 'sizeMatchesSource': True, 'contentHashChecked': True}


def main():
    if not __debug__:
        raise RuntimeError('Run this check without Python optimization; assertions are required.')
    if len(sys.argv) != 2:
        raise ValueError('Usage: python scripts/check-private-preview.py https://exact-owned-site.chatgpt.site')
    origin = sys.argv[1].rstrip('/')
    url = urllib.parse.urlsplit(origin)
    if (url.scheme != 'https' or url.username or url.password or url.path or url.query or url.fragment
            or not url.hostname or not url.hostname.endswith('.chatgpt.site') or url.port not in (None, 443)):
        raise ValueError('Provide the exact HTTPS Sites origin, without credentials or parameters.')
    token = getpass.getpass('Existing Site service token (hidden): ') if sys.stdin.isatty() else sys.stdin.readline().strip()
    if not token or '\r' in token or '\n' in token:
        raise ValueError('A single existing Site service token is required on hidden input or stdin.')

    class SameOriginRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            target = urllib.parse.urlsplit(newurl)
            if target.scheme != url.scheme or target.netloc != url.netloc:
                raise ValueError('Refusing to forward authorization outside this Site.')
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    authorized = urllib.request.build_opener(SameOriginRedirect())
    anonymous = urllib.request.build_opener(NoRedirect())

    def request(route, *, authenticated=True, method='GET', data=None, extra=None, binary=False, limit=MAX_PAGE_BYTES, range_size=None):
        assert route.startswith('/') and not route.startswith('//'), 'Only local paths are allowed'
        headers = {'User-Agent': 'Pizza-Zio-owned-preview-smoke/2.0'}
        if authenticated:
            headers['OAI-Sites-Authorization'] = 'Bearer ' + token
        headers.update(extra or {})
        req = urllib.request.Request(origin + route, headers=headers, method=method, data=data)
        try:
            result = (authorized if authenticated else anonymous).open(req, timeout=20)
        except urllib.error.HTTPError as error:
            result = error
        with result:
            response_headers = {key.lower(): value for key, value in result.headers.items()}
            if range_size is not None:
                assert route == VIDEO_PATH and method == 'GET' and headers.get('Range') == 'bytes=0-0' and binary, 'Unexpected bounded range request'
                limit = range_body_limit(result.status, response_headers, range_size)
            body = result.read(limit + 1) if method != 'HEAD' else b''
            if len(body) > limit:
                raise ValueError('Response exceeded smoke-test bound.')
            return result.status, response_headers, body if binary else body.decode('utf-8', errors='replace')

    public = Path(__file__).resolve().parents[1] / 'public'
    presentation = (public / 'presentation.js').read_text()
    results, images, home = [], set(), None
    for route in PAGE_TITLES:
        status, headers, body = request(route)
        assert status == 200 and 'text/html' in headers.get('content-type', ''), f'{route}: page not served'
        page = verify_page(body, route, presentation)
        images.update(page.images)
        if route == '/':
            home = body
        results.append({'path': route, 'status': status, 'h1': page.headings[0], 'scripts': len(page.scripts), 'forms': 0, 'staticCsp': True, 'noindex': True})
    print('Private preview: pages checked.', file=sys.stderr, flush=True)
    for route in ['/.env', '/.env.local', '/.git/config', '/package.json', '/lib/leadConfig.ts', '/lib/leadService.ts', '/.next/server/app/api/lead/route.js']:
        status, headers, body = request(route)
        # A static SPA fallback is reported honestly and must equal the whole known home page.
        fallback = status == 200 and body == home
        assert status in (403, 404) or fallback, f'{route}: unexpected exposed response'
        assert not re.search(r'\[remote "origin"\]|LEAD_WEBHOOK_TOKEN=|export async function|-----BEGIN (?:RSA )?PRIVATE KEY-----', body), f'{route}: source marker exposed'
        results.append({'path': route, 'status': status, 'staticFallback': fallback, 'sourceExposed': False})
    status, headers, body = request('/api/lead', method='POST', data=b'{}', extra={'Content-Type': 'application/json'})
    assert status in (403, 404, 405), f'Unexpected static submission response: {status}'
    results.append({'path': '/api/lead', 'method': 'POST', 'status': status, 'collection': False, 'serverApiDeployed': False})
    print('Private preview: static surface checked.', file=sys.stderr, flush=True)
    for asset in sorted(images | FONT_PATHS):
        local = public / asset.lstrip('/')
        assert 0 < local.stat().st_size <= MAX_ASSET_BYTES, f'{asset}: local asset exceeds bound'
        status, headers, body = request(asset, binary=True, limit=MAX_ASSET_BYTES)
        assert status == 200, f'{asset}: asset unavailable'
        assert hashlib.sha256(body).digest() == hashlib.sha256(local.read_bytes()).digest(), f'{asset}: deployed content mismatch'
        results.append({'path': asset, 'status': status, 'matchesSource': True})
    print('Private preview: images and fonts checked.', file=sys.stderr, flush=True)
    results.append(verify_video(request, public / VIDEO_PATH.lstrip('/')))
    print('Private preview: bounded video metadata checked.', file=sys.stderr, flush=True)
    for route in [*PAGE_TITLES, '/images/zio-hero-v2.webp', VIDEO_PATH]:
        method = 'HEAD' if route == VIDEO_PATH else 'GET'
        status, headers, body = request(route, authenticated=False, method=method)
        assert status in (401, 403, 301, 302, 303, 307, 308), f'{route}: anonymous access was not explicitly denied or redirected'
        assert HOME_HEADING not in body and 'Ouvrez votre pizzeria dans le' not in body, f'{route}: private content visible anonymously'
        if 300 <= status < 400:
            target = urllib.parse.urlsplit(urllib.parse.urljoin(origin + route, headers.get('location', '')))
            assert headers.get('location') and target.scheme == 'https', f'{route}: invalid anonymous authentication redirect'
        results.append({'path': route, 'anonymousStatus': status, 'privateContentVisible': False, 'redirectFollowed': False})
    print('Private preview: anonymous access checked.', file=sys.stderr, flush=True)
    print(json.dumps({'origin': origin, 'tlsValidation': True, 'deploymentType': 'private-static-consultation', 'serverApiDeployed': False, 'checks': results}, ensure_ascii=False))


if __name__ == '__main__':
    main()
