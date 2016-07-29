@echo off

call npm --version
if %errorlevel% == 0 (
    if not exist node_modules\http-server (
        npm install http-server
    )
    node node_modules/http-server/bin/http-server -p 8000 -o -c-1
    exit /b 0
)

call python --version
if %errorlevel% == 0 (
    python -m http.server 8000
    python -m SimpleHTTPServer 8000
    exit /b 0
)

call ruby --version
if %errorlevel% == 0 (
    ruby -run -e httpd . -p 8000
    exit /b 0
)

echo "Please install Node.js or Python or Ruby and rerun this script, or use your favorite HTTP server."
exit /b 1
