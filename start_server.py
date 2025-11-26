import http.server
import socketserver
import webbrowser
import os

# The initial port to try.
PORT = 8000

# The directory this script is in.
# This ensures the server serves files from the script's location.
web_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(web_dir)

Handler = http.server.SimpleHTTPRequestHandler

httpd = None
# Keep trying to create a server on the next available port.
while True:
    try:
        # Try to create the server on the current PORT.
        httpd = socketserver.TCPServer(("", PORT), Handler)
        # If successful, break the loop.
        break
    except OSError:
        # This means the port is already in use.
        print(f"Port {PORT} is already in use, trying next port.")
        # Try the next port number.
        PORT += 1

# The URL to open in the web browser.
url = f"http://localhost:{PORT}"

print(f"Serving directory '{web_dir}' at {url}")

# Open the URL in a new browser tab.
webbrowser.open_new(url)

# Keep the server running until it's manually stopped.
httpd.serve_forever()
