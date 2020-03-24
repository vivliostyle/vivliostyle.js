@echo off
if not "%~1" == "--help" if not "%~1" == "-h" if not "%~1" == "/?" goto START
echo.
echo Usage: %~n0 [^<document URL^> [^<parameter^>=^<value^> ...] ]
echo.
echo Start a local web server and open the Vivliostyle Viewer in browser.
echo.
echo Options:
echo.
echo   ^<document URL^>          URL or a file path relative to the viewer URL.
echo.
echo   ^<parameter^>=^<value^> ... option parameters for the viewer.
echo.
echo   Example: %~n0 /example/mybook.html bookMode=true renderAllPages=false
echo.
echo   -h, --help
echo.
echo See Vivliostyle User Guide for details.
echo.
exit /b 0

:START
setlocal enableDelayedExpansion
set ABS_DIR=%~dp0
set REL_DIR=!ABS_DIR:%CD%\=!

if "%REL_DIR%" == "%ABS_DIR%" (
    set ROOT_DIR=%ABS_DIR:~0,3%
    set REL_DIR=%REL_DIR:~3%
    cd /d !ROOT_DIR!
)
set VIEWER=%REL_DIR%viewer/
set ARGS=%*
set ARGS=%ARGS:"=%
if not "%ARGS%" == "" (
    set VIEWER="%VIEWER%#src=%ARGS: =&%"
)
set VIEWER=%VIEWER:\=/%
set VIEWER=!VIEWER: =%%20!

call "%REL_DIR%start-webserver" %VIEWER% 8000
