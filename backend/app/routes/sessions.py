from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.session import Session

sessions_bp = Blueprint("sessions", __name__)


@sessions_bp.post("/")
@jwt_required()
def create_session():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    from datetime import datetime
    session = Session(
        requester_id=user_id,
        receiver_id=data["receiver_id"],
        skill_id=data["skill_id"],
        format=data.get("format", "online"),
        date=datetime.fromisoformat(data["date"]) if data.get("date") else None,
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@sessions_bp.get("/")
@jwt_required()
def list_sessions():
    user_id = int(get_jwt_identity())
    sessions = Session.query.filter(
        (Session.requester_id == user_id) | (Session.receiver_id == user_id)
    ).order_by(Session.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions])


@sessions_bp.patch("/<int:session_id>")
@jwt_required()
def update_session(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.get_or_404(session_id)
    data = request.get_json()
    if "status" in data and session.receiver_id == user_id:
        session.status = data["status"]
    if "date" in data:
        from datetime import datetime
        session.date = datetime.fromisoformat(data["date"])
    db.session.commit()
    return jsonify(session.to_dict())
