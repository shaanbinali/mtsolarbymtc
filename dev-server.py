#!/usr/bin/env python3
"""
M.T. Solar by MTC - Local Development Server with Simulated Backend
Serves static website files and handles POST /api/submit-lead locally.
Leads are logged to the console and saved to data/leads.json.

Usage:
    python3 dev-server.py [port]
Default port: 8080
"""

import http.server
import json
import os
import socketserver
import sys
import time
from urllib.parse import urlparse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
LEADS_FILE = os.path.join(DATA_DIR, 'leads.json')


def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, indent=2)


def save_lead(record):
    ensure_data_dir()
    leads = []
    try:
        with open(LEADS_FILE, 'r', encoding='utf-8') as f:
            leads = json.load(f)
    except Exception:
        leads = []
    leads.append(record)
    with open(LEADS_FILE, 'w', encoding='utf-8') as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)


class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/leads':
            ensure_data_dir()
            try:
                with open(LEADS_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                content = '[]'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            return
        if parsed.path == '/api/export-leads':
            ensure_data_dir()
            try:
                with open(LEADS_FILE, 'r', encoding='utf-8') as f:
                    leads = json.load(f)
            except Exception:
                leads = []
            headers = ['Lead ID', 'Form Type', 'Source Page', 'Submitted At', 'Phone', 'Data']
            lines = [','.join(f'"{h}"' for h in headers)]
            for item in leads:
                flds = item.get('fields', {})
                lines.append(','.join([
                    f'"{item.get("lead_id", "")}"',
                    f'"{item.get("form_type", "")}"',
                    f'"{item.get("source_page", "")}"',
                    f'"{item.get("submitted_at", "")}"',
                    f'"{flds.get("phone", "")}"',
                    f'"{json.dumps(flds).replace(chr(34), chr(34)+chr(34))}"'
                ]))
            csv_data = '\r\n'.join(lines).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
            self.send_header('Content-Disposition', 'attachment; filename="leads.csv"')
            self.end_headers()
            self.wfile.write(csv_data)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/submit-lead':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                payload = json.loads(body)

                # Honeypot spam check
                hp = payload.get('_hp', '')
                if hp and str(hp).strip():
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'message': 'Thank you! Your request has been received.'
                    }).encode('utf-8'))
                    return

                form_type = payload.get('form_type', 'site_survey')
                source_page = payload.get('source_page', '/')
                data = payload.get('data', {})

                # Validate phone
                raw_phone = ''.join(filter(str.isdigit, str(data.get('phone', ''))))
                if len(raw_phone) < 10:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': False,
                        'error': 'Please enter a valid 10-digit mobile number.'
                    }).encode('utf-8'))
                    return

                lead_record = {
                    'lead_id': f'MTC-{int(time.time() * 1000)}',
                    'form_type': form_type,
                    'source_page': source_page,
                    'source_title': payload.get('source_title', ''),
                    'submitted_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'client_ip': self.client_address[0],
                    'fields': data
                }

                save_lead(lead_record)

                print('\n' + '=' * 60)
                print(f'⚡ [LOCAL DEV LEAD CAPTURED] Type: {form_type.upper()}')
                print(f'📍 Source: {source_page}')
                print(f'👤 Contact: {data.get("name") or data.get("company") or "N/A"} ({raw_phone})')
                if data.get('pincode'):
                    print(f'📮 PIN: {data.get("pincode")}')
                print(f'📦 Fields: {json.dumps(data, ensure_ascii=False)}')
                print(f'💾 Saved to: {LEADS_FILE}')
                print('=' * 60 + '\n')

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': 'Thank you! Your request has been received. Our team will contact you shortly.',
                    'lead_id': lead_record['lead_id']
                }).encode('utf-8'))
                return

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': f'Server error: {str(e)}'
                }).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()


if __name__ == '__main__':
    ensure_data_dir()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), DevHandler) as httpd:
        print(f'☀️  M.T. Solar Local Dev Server running at http://localhost:{PORT}/')
        print(f'⚡ Local Forms API endpoint: http://localhost:{PORT}/api/submit-lead')
        print(f'📋 View saved leads: http://localhost:{PORT}/api/leads')
        print('Press Ctrl+C to stop.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopping server.')
