@echo off
if not "%~1" == "--help" if not "%~1" == "-h" if not "%~1" == "/?" goto START
echo.
echo Usage: %~n0 [^<path^> [^<port^>] ]
echo.
echo Start a local web server and open the default browser.
echo.
echo Options:
echo.
echo   ^<path^>                  URL path to open in the browser.
echo.
echo   ^<port^>                  Port to use. (default: 8000)
echo.
echo   -h, --help
echo.
exit /b 0

:START
setlocal
set OPEN_PATH="%~1"
set PORT=%~2
if "%PORT%" == "" set PORT=8000

set DIR=%~dp0
path %DIR%;%PATH%
if "%DIR:~-1%" == "\" set DIR=%DIR:~0,-1%

where /q npm && (
    where /q http-server || (
        call npm install http-server --prefix "%DIR%" || goto FALLBACK1
    )
    call http-server . -p %PORT% -c-1 --cors --no-dotfiles -o %OPEN_PATH%
    exit /b 0
)
:FALLBACK1

set OPEN_URL="http://127.0.0.1:%PORT%/"%OPEN_PATH%
set OPEN_URL=%OPEN_URL:""=%

where /q ruby && (
    start "" %OPEN_URL%
    ruby -run -e httpd . -p %PORT%
    exit /b 0
)

where /q python && (
    start "" %OPEN_URL%
    python -m SimpleHTTPServer %PORT% || python -m http.server %PORT%
    exit /b 0
)

echo Please install Node.js or Ruby or Python and rerun this script, or use your favorite HTTP server.
exit /b 1
