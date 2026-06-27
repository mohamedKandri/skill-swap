from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from .routes.auth import auth_bp
    from .routes.profile import profile_bp
    from .routes.skills import skills_bp
    from .routes.matches import matches_bp
    from .routes.sessions import sessions_bp
    from .routes.reviews import reviews_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(profile_bp,  url_prefix="/api/profile")
    app.register_blueprint(skills_bp,   url_prefix="/api/skills")
    app.register_blueprint(matches_bp,  url_prefix="/api/matches")
    app.register_blueprint(sessions_bp, url_prefix="/api/sessions")
    app.register_blueprint(reviews_bp,  url_prefix="/api/reviews")

    return app
