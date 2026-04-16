#!/bin/bash
set -e

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating and installing dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example — edit it before running the app."
fi

echo ""
echo "Setup complete!"
echo ""
echo "  Activate venv :  source venv/bin/activate"
echo "  Run web server:  python main.py"
echo "  Run Celery    :  celery -A main worker --loglevel=info"
echo "  Run Celery beat: celery -A main beat --loglevel=info"
