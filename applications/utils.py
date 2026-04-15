from flask import Flask
from celery import Celery, Task


def api_response(success, message=None, data=None, status=200):
    """Build a consistent JSON API response."""
    resp = {"success": success}
    if message is not None:
        resp["message"] = message
    if data is not None:
        resp.update(data)
    return resp, status


def celery_init_app(app: Flask) -> Celery:
    """Initialize Celery with Flask app context."""
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app
