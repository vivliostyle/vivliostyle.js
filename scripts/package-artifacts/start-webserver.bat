@echo off

call ruby --version
if %errorlevel% == 0 (
    ruby -rwebrick -e "system 'start http://localhost:8000'; WEBrick::HTTPServer.new(DocumentRoot: '.', Port: 8000, RequestCallback: Proc.new{|req,res| res['Access-Control-Allow-Origin'] = '*'}).start" -Eascii-8bit:ascii-8bit
    exit /b 0
)

call python --version
if %errorlevel% == 0 (
    python -m http.server 8000
    python -m SimpleHTTPServer 8000
    exit /b 0
)

call npm --version
if %errorlevel% == 0 (
    if not exist node_modules\http-server (
        npm install http-server
    )
    node node_modules/http-server/bin/http-server -p 8000 -o -c-1
    exit /b 0
)

echo "Please install Ruby or Python or Node.js and rerun this script, or use your favorite HTTP server."
exit /b 1
