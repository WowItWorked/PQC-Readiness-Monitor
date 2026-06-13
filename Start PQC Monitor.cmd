@echo off
rem Starts the local PQC Readiness Monitor server (if not already running)
rem and opens the dashboard in your default browser.
start "PQC Monitor server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.claude\serve.ps1"
timeout /t 2 /nobreak >nul
start "" http://localhost:8421/
