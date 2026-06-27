from app import db
from datetime import datetime


class Review(db.Model):
    __tablename__ = "reviews"

    id          = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_id  = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    rating      = db.Column(db.Integer, nullable=False)  # 1–5
    comment     = db.Column(db.Text, default="")
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    reviewer = db.relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = db.relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
    session  = db.relationship("Session")

    def to_dict(self):
        return {
            "id":          self.id,
            "reviewer":    self.reviewer.to_dict(),
            "reviewee":    self.reviewee.to_dict(),
            "session_id":  self.session_id,
            "rating":      self.rating,
            "comment":     self.comment,
            "created_at":  self.created_at.isoformat(),
        }
