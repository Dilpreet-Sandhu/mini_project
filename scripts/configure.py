#!/usr/bin/env python3
"""Create local settings without overwriting existing files."""
import argparse
from pathlib import Path
import secrets
from urllib.parse import urlparse

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description="Set up Roomline for local development")
parser.add_argument("--api-url", default="http://localhost:3000", help="Use your computer's LAN IPv4 address for a physical phone")
args = parser.parse_args()
url = urlparse(args.api_url)
if url.scheme not in ("http", "https") or not url.netloc or "\n" in args.api_url or "\r" in args.api_url:
    parser.error("--api-url must be a valid HTTP(S) URL")
settings = {
    root / "backend" / ".env": (
        "DATABASE_URL=postgres://roomline:roomline_local@localhost:5432/roomline\n"
        f"ACCESS_TOKEN_SECRET={secrets.token_hex(48)}\n"
        "PORT=3000\n"
        "CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081\n"
        "RUST_LOG=info\n"
    ),
    root / "frontend" / ".env": f"EXPO_PUBLIC_API_URL={args.api_url.rstrip('/')}\n",
}
for path, contents in settings.items():
    try:
        with path.open("x") as file:
            file.write(contents)
        path.chmod(0o600)
        print(f"Created {path.relative_to(root)}")
    except FileExistsError:
        print(f"Kept existing {path.relative_to(root)} (edit it to change settings)")
print("Settings ready. See README.md for database, server and app startup.")
