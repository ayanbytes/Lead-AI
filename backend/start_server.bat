@echo off
echo Checking port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 " ^| findstr "LISTENING"') do (
    echo Killing PID %%a
    taskkill /F /PID %%a
)
echo Port 8001 cleared. Starting backend...
cd /d "%~dp0"
python main.py
