from app import db
from datetime import datetime


class Match(db.Model):
    __tablename__ = "matches"

    id         = db.Column(db.Integer, primary_key=True)
    user_a_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_b_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    score      = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_a = db.relationship("User", foreign_keys=[user_a_id])
    user_b = db.relationship("User", foreign_keys=[user_b_id])

    def to_dict(self):
        return {
            "id":      self.id,
            "user_a":  self.user_a.to_dict(),
            "user_b":  self.user_b.to_dict(),
            "score":   self.score,
        }
