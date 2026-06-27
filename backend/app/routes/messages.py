from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.message import Message

messages_bp = Blueprint("messages", __name__)


@messages_bp.get("/")
@jwt_required()
def list_conversations():
    """Returns the most recent message per unique conversation partner."""
    user_id = int(get_jwt_identity())
    msgs = Message.query.filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()

    seen = {}
    for m in msgs:
        other_id = m.receiver_id if m.sender_id == user_id else m.sender_id
        if other_id not in seen:
            other = m.receiver if m.sender_id == user_id else m.sender
            seen[other_id] = {
                "user":         {"id": other.id, "name": other.name, "avatar": other.avatar},
                "last_message": m.body,
                "last_at":      m.created_at.isoformat(),
            }
    return jsonify(list(seen.values()))


@messages_bp.get("/<int:other_id>")
@jwt_required()
def get_conversation(other_id):
    user_id = int(get_jwt_identity())
    msgs = Message.query.filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == other_id)) |
        ((Message.sender_id == other_id) & (Message.receiver_id == user_id))
    ).order_by(Message.created_at.asc()).all()
    return jsonify([m.to_dict() for m in msgs])


@messages_bp.post("/")
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    body = (data.get("body") or "").strip()
    if not body:
        return jsonify({"error": "Message body cannot be empty."}), 400
    msg = Message(sender_id=user_id, receiver_id=data["receiver_id"], body=body)
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201
