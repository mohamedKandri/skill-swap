from app import db


class Skill(db.Model):
    __tablename__ = "skills"

    id       = db.Column(db.Integer, primary_key=True)
    name     = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(100), default="General")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "category": self.category}


class UserSkill(db.Model):
    __tablename__ = "user_skills"

    id       = db.Column(db.Integer, primary_key=True)
    user_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    type     = db.Column(db.Enum("offer", "want", name="skill_type"), nullable=False)

    user  = db.relationship("User",  back_populates="skills")
    skill = db.relationship("Skill")

    def to_dict(self):
        return {"skill": self.skill.to_dict(), "type": self.type}
