from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.skill import Skill, UserSkill

skills_bp = Blueprint("skills", __name__)


@skills_bp.get("/")
def list_skills():
    skills = Skill.query.order_by(Skill.category, Skill.name).all()
    return jsonify([s.to_dict() for s in skills])


@skills_bp.post("/")
@jwt_required()
def add_skill():
    data = request.get_json()
    skill = Skill.query.filter_by(name=data["name"]).first()
    if not skill:
        skill = Skill(name=data["name"], category=data.get("category", "General"))
        db.session.add(skill)
        db.session.flush()
    user_id = int(get_jwt_identity())
    existing = UserSkill.query.filter_by(user_id=user_id, skill_id=skill.id, type=data["type"]).first()
    if not existing:
        db.session.add(UserSkill(user_id=user_id, skill_id=skill.id, type=data["type"]))
    db.session.commit()
    return jsonify(skill.to_dict()), 201


@skills_bp.delete("/<int:skill_id>")
@jwt_required()
def remove_skill(skill_id):
    user_id = int(get_jwt_identity())
    skill_type = request.args.get("type")
    us = UserSkill.query.filter_by(user_id=user_id, skill_id=skill_id, type=skill_type).first_or_404()
    db.session.delete(us)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200
