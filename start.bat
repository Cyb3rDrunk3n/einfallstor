@echo off
rem Startet Einfallstor und oeffnet die Seite im Browser.
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python wurde nicht gefunden.
  echo Installiere Python 3.10 oder neuer von python.org und starte diese Datei erneut.
  pause
  exit /b 1
)
python server.py --open
pause
