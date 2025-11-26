import http.server
import socketserver
import webbrowser
import os
import threading

def find_available_port(start_port):
    """
    Finds an available network port, starting from the given port.
    It does this by trying to bind a socket to the port. If it fails (because the port is in use),
    it just tries the next one. It's a simple but effective way to avoid the "port already in use" error
    that is so dreadfully common.
    """
    port = start_port
    while True:
        try:
            with socketserver.TCPServer(("localhost", port), http.server.SimpleHTTPRequestHandler) as s:
                return port
        except OSError:
            print(f"Port {port} is in use, trying next one...")
            port += 1

def start_server(directory, port):
    """
    Starts the HTTP server in a separate thread.
    We run it in a thread so that the main part of the script doesn't get stuck here.
    This allows us to open a web browser after the server has started. It's a basic form of multitasking.
    """
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)

    # We need to change to the directory to serve files from it.
    os.chdir(directory)
    httpd = socketserver.TCPServer(("", port), Handler)
    
    server_thread = threading.Thread(target=httpd.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    print(f"Server thread started for directory '{directory}'.")

def main():
    """
    The main function. It finds a port, checks for index.html, starts the server,
    and opens a web browser. It's a sequence of trivial events, but it must be done.
    """
    # The script assumes it's in the root of the project where it's run.
    project_dir = os.getcwd()
    
    index_file = os.path.join(project_dir, 'index.html')
    if not os.path.exists(index_file):
        print("="*40)
        print("! GLARING ISSUE !")
        print("No 'index.html' file found in this directory.")
        print("The server will start, but it will have nothing to show.")
        print("You'll likely see a 404 error or a directory listing.")
        print("="*40)

    port = find_available_port(8000)
    
    print(f"Starting server in directory: {project_dir}")
    print(f"Found available port: {port}")
    
    start_server(project_dir, port)
    
    url = f"http://localhost:{port}"
    print(f"Server is running at: {url}")
    
    try:
        webbrowser.open(url)
        print("Opening web browser...")
    except Exception as e:
        print(f"Could not open web browser. You'll have to do it yourself. Here's the error: {e}")

    print("\nServer is running in the background.")
    print("To stop the server, you have to close this terminal window.")
    
    try:
        input("Press Enter to close this script (the server will keep running in the background)...")
    except KeyboardInterrupt:
        print("\nScript interrupted. The server continues its lonely vigil.")

if __name__ == "__main__":
    main()
