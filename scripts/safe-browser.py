#!/usr/bin/env python3
"""Existing signed-in browser control with URL-query/credential output redaction.
Never invoke cookie/state/network dumps; those may contain secrets unrelated to URLs.
"""
import subprocess,sys,re
assert not any(x in {'cookies','state','network','har','trace'} for x in sys.argv[1:]), 'Credential-bearing browser dumps are disallowed'
p=subprocess.run(['agent-browser','--cdp','9333','--session','gitflare-auth',*sys.argv[1:]],capture_output=True,text=True,timeout=40)
def redact(s):
 s=re.sub(r'(https?://[^\s"<>?]+)\?[^\s"<>]*',r'\1?[redacted]',s)
 s=re.sub(r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?','[redacted-jwt]',s)
 return s
print(redact(p.stdout));print(redact(p.stderr),file=sys.stderr)
sys.exit(p.returncode)
