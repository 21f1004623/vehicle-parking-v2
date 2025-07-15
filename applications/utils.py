import random
import string
from flask import Flask
from celery import Celery, Task

def generate_filename(extension):
    """Generate a random filename for file uploads"""
    N = 20
    result = ""
    n = len(string.ascii_letters)
    for i in range(N):
        result += string.ascii_letters[random.randint(0, n-1)]
    return result + extension

def celery_init_app(app: Flask) -> Celery:
    """Initialize Celery with Flask app context"""
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app 