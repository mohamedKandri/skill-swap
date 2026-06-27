from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.matching import compute_matches

matches_bp = Blueprint("matches", __name__)


@matches_bp.get("/")
@jwt_required()
def get_matches():
    user_id = int(get_jwt_identity())
    matches = compute_matches(user_id)
    return jsonify(matches)
