from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.review import Review
from app.models.session import Session

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.post("/")
@jwt_required()
def create_review():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    session = Session.query.get_or_404(data["session_id"])
    if session.status != "completed":
        return jsonify({"error": "Session not completed"}), 400
    if user_id not in (session.requester_id, session.receiver_id):
        return jsonify({"error": "Forbidden"}), 403
    reviewee_id = session.receiver_id if user_id == session.requester_id else session.requester_id
    review = Review(
        reviewer_id=user_id,
        reviewee_id=reviewee_id,
        session_id=data["session_id"],
        rating=data["rating"],
        comment=data.get("comment", ""),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201


@reviews_bp.get("/user/<int:user_id>")
def get_user_reviews(user_id):
    reviews = Review.query.filter_by(reviewee_id=user_id).order_by(Review.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reviews])
