"""CI-only CONNECT fixture. Never forwards requests to the Internet."""
import socketserver


class Proxy(socketserver.StreamRequestHandler):
    def handle(self):
        self.connection.settimeout(15)
        request = self.rfile.readline().decode("ascii", errors="replace").strip()
        while self.rfile.readline() not in (b"\r\n", b"\n", b""):
            pass
        if request != "CONNECT 198.18.0.1:80 HTTP/1.1":
            self.wfile.write(b"HTTP/1.1 502 Fixture destination only\r\nContent-Length: 0\r\n\r\n")
            return
        self.wfile.write(b"HTTP/1.1 200 Connection established\r\n\r\n")
        self.wfile.flush()
        request = self.rfile.readline()
        while self.rfile.readline() not in (b"\r\n", b"\n", b""):
            pass
        if request.startswith(b"GET /vpn-smoke "):
            body = b"VPROXIES_TUNNEL_OK"
            self.wfile.write(b"HTTP/1.1 200 OK\r\nConnection: close\r\nContent-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body)
            print("PASS: Android TUN traffic arrived through HTTP CONNECT", flush=True)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Server(("0.0.0.0", 18080), Proxy) as server:
    server.serve_forever()
