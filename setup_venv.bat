@echo off
echo Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: python not found. Make sure Python 3.9+ is installed and on your PATH.
    exit /b 1
)

echo Installing dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

if not exist .env (
    copy .env.example .env
    echo Created .env from .env.example — edit it before running the app.
)

echo.
echo Setup complete!
echo.
echo   Activate venv :  venv\Scripts\activate
echo   Run web server:  python main.py
echo   Run Celery    :  celery -A main worker --loglevel=info
echo   Run Celery beat: celery -A main beat --loglevel=info
