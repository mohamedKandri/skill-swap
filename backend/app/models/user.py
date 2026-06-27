from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    bio        = db.Column(db.Text, default="")
    avatar     = db.Column(db.String(300), default="")
    university = db.Column(db.String(150), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    skills         = db.relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    sent_requests  = db.relationship("Session", foreign_keys="Session.requester_id", back_populates="requester")
    recv_requests  = db.relationship("Session", foreign_keys="Session.receiver_id",  back_populates="receiver")
    reviews_given  = db.relationship("Review",  foreign_keys="Review.reviewer_id",  back_populates="reviewer")
    reviews_received = db.relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def avg_rating(self):
        if not self.reviews_received:
            return None
        return round(sum(r.rating for r in self.reviews_received) / len(self.reviews_received), 1)

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "bio":        self.bio,
            "avatar":     self.avatar,
            "university": self.university,
            "avg_rating": self.avg_rating(),
            "skills":     [us.to_dict() for us in self.skills],
        }
