"""Serve the mobile browser game to devices on the same local network."""

from __future__ import annotations

import argparse
import socket
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


WEB_DIR = Path(__file__).with_name("web")


def local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(("192.0.2.1", 80))
            return probe.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000, help="HTTP port (default: 8000)")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("port must be between 1 and 65535")
    if not (WEB_DIR / "index.html").is_file():
        parser.error(f"mobile web app files were not found in {WEB_DIR}")

    handler = partial(SimpleHTTPRequestHandler, directory=str(WEB_DIR))
    server = ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    print("Maden İmparatorluğu mobil sürümü çalışıyor.")
    print(f"Bu bilgisayarda: http://localhost:{args.port}")
    print(f"Aynı Wi-Fi ağındaki telefonda: http://{local_ip()}:{args.port}")
    print("Durdurmak için Ctrl+C'ye basın.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nMobil oyun sunucusu kapatılıyor.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
