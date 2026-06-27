from app import db
from datetime import datetime


class Message(db.Model):
    __tablename__ = "messages"

    id          = db.Column(db.Integer, primary_key=True)
    sender_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body        = db.Column(db.Text, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    sender   = db.relationship("User", foreign_keys=[sender_id])
    receiver = db.relationship("User", foreign_keys=[receiver_id])

    def to_dict(self):
        return {
            "id":          self.id,
            "sender_id":   self.sender_id,
            "receiver_id": self.receiver_id,
            "body":        self.body,
            "created_at":  self.created_at.isoformat(),
            "sender":      {"id": self.sender.id, "name": self.sender.name, "avatar": self.sender.avatar},
        }
