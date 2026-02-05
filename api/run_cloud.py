from http.server import BaseHTTPRequestHandler
import json
import sys
import io
import contextlib

class handler(BaseHTTPRequestHandler):
    def do_POST(self):

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
            code = body.get('code', '')
            language = body.get('language', 'python')

            captured_output = io.StringIO()
            
            if language == 'python' or language == 'py':
                try:
                    with contextlib.redirect_stdout(captured_output):
                        exec(code, {'__builtins__': __builtins__}, {})
                    
                    result = captured_output.getvalue()
                    if not result:
                        result = "[Success] Code executed, but no output (did you forget print?)."

                except Exception as e:
                    result = f"Traceback (most recent call last):\n{str(e)}"
            else:
                result = "Language not supported in Cloud Mode."

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({"output": result})
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))