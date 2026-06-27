from app import db
from datetime import datetime


class Session(db.Model):
    __tablename__ = "sessions"

    id           = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skill_id     = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    date         = db.Column(db.DateTime, nullable=True)
    format       = db.Column(db.Enum("online", "in-person", name="session_format"), default="online")
    status       = db.Column(
        db.Enum("pending", "accepted", "declined", "cancelled", "completed", name="session_status"),
        default="pending"
    )
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    requester = db.relationship("User", foreign_keys=[requester_id], back_populates="sent_requests")
    receiver  = db.relationship("User", foreign_keys=[receiver_id],  back_populates="recv_requests")
    skill     = db.relationship("Skill")

    def to_dict(self):
        return {
            "id":          self.id,
            "requester":   self.requester.to_dict(),
            "receiver":    self.receiver.to_dict(),
            "skill":       self.skill.to_dict(),
            "date":        self.date.isoformat() if self.date else None,
            "format":      self.format,
            "status":      self.status,
            "created_at":  self.created_at.isoformat(),
        }
