from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User

profile_bp = Blueprint("profile", __name__)


@profile_bp.get("/me")
@jwt_required()
def get_me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify(user.to_dict())


@profile_bp.put("/me")
@jwt_required()
def update_me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json()
    for field in ("name", "bio", "avatar", "university"):
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return jsonify(user.to_dict())


@profile_bp.get("/<int:user_id>")
def get_profile(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())
