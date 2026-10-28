"""Small HTTPS smoke check for the owner-private, static consultation preview."""
import getpass
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = 0
        self.forms = 0
        self.csp = ''

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.scripts += tag == 'script'
        self.forms += tag == 'form'
        if tag == 'meta' and attributes.get('http-equiv', '').lower() == 'content-security-policy':
            self.csp = attributes.get('content', '')


origin = sys.argv[1].rstrip('/')
url = urllib.parse.urlsplit(origin)
if url.scheme != 'https' or url.username or url.password or url.path or url.query or url.fragment or not url.hostname.endswith('.chatgpt.site'):
    raise ValueError('Provide the exact HTTPS Sites origin, without credentials or parameters.')
token = getpass.getpass('Ready for existing Site service token (input is hidden): ')


class SameOriginRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urllib.parse.urlsplit(newurl)
        if target.scheme != url.scheme or target.netloc != url.netloc:
            raise ValueError('Refusing to forward authorization outside this Site.')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


opener = urllib.request.build_opener(SameOriginRedirect())


def request(route, *, authenticated=True, method='GET', data=None, extra=None):
    headers = {'User-Agent': 'Pizza-Zio-owned-preview-smoke/1.0'}
    if authenticated:
        headers['OAI-Sites-Authorization'] = 'Bearer ' + token
    headers.update(extra or {})
    req = urllib.request.Request(origin + route, headers=headers, method=method, data=data)
    try:
        result = opener.open(req, timeout=20)
    except urllib.error.HTTPError as error:
        result = error
    body = result.read(262145)
    if len(body) > 262144:
        raise ValueError('Response exceeded smoke-test bound.')
    return result.status, dict(result.headers.items()), body.decode('utf-8', errors='replace')


results = []
for route, title in [('/', 'Votre projet de pizzeria.'), ('/confidentialite/', 'Données personnelles'), ('/mentions-legales/', 'Mentions légales')]:
    status, headers, body = request(route)
    page = Page()
    page.feed(body)
    assert status == 200 and title in body, f'{route}: page not served'
    assert page.scripts == 0 and page.forms == 0, f'{route}: unexpected executable content or form'
    assert "default-src 'none'" in page.csp and "form-action 'none'" in page.csp, f'{route}: restrictive CSP missing'
    results.append({'path': route, 'status': status, 'scripts': 0, 'forms': 0, 'csp': True})
for route in ['/.env', '/.git/config', '/lib/leadHandler.ts']:
    status, headers, body = request(route)
    # Some static hosts serve their index as a fallback. Never call that a 404.
    assert status in (403, 404) or (status == 200 and 'Votre projet de pizzeria.' in body), f'{route}: unexpected exposed response'
    assert '[remote "origin"]' not in body and 'LEAD_WEBHOOK_TOKEN=' not in body and 'export async function' not in body
    results.append({'path': route, 'status': status, 'sourceExposed': False})
status, headers, body = request('/api/lead', method='POST', data=b'{}', extra={'Content-Type': 'application/json'})
assert status in (403, 404, 405), f'Unexpected submission response: {status}'
results.append({'path': '/api/lead', 'method': 'POST', 'status': status, 'collection': False})
status, headers, body = request('/', authenticated=False)
assert 'Votre projet de pizzeria.' not in body, 'Private content visible anonymously'
results.append({'anonymousStatus': status, 'privateContentVisible': False})
print(json.dumps({'origin': origin, 'tlsValidation': True, 'checks': results}, ensure_ascii=False))
