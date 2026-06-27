from app.models.user import User


def compute_matches(current_user_id: int) -> list:
    me = User.query.get(current_user_id)

    my_offers = {us.skill_id: us.skill for us in me.skills if us.type == "offer"}
    my_wants  = {us.skill_id: us.skill for us in me.skills if us.type == "want"}

    results = []
    others = User.query.filter(User.id != current_user_id).all()

    for other in others:
        their_offers = {us.skill_id: us.skill for us in other.skills if us.type == "offer"}
        their_wants  = {us.skill_id: us.skill for us in other.skills if us.type == "want"}

        i_teach_them  = set(my_offers) & set(their_wants)
        they_teach_me = set(their_offers) & set(my_wants)

        matched = len(i_teach_them) + len(they_teach_me)
        total   = len(set(my_offers) | set(my_wants) | set(their_offers) | set(their_wants))
        score   = round((matched / total * 100) if total else 0, 1)

        if matched > 0:
            results.append({
                "user":  other.to_dict(),
                "score": score,
                "i_teach_them":  [{"id": sid, "name": my_offers[sid].name}  for sid in i_teach_them],
                "they_teach_me": [{"id": sid, "name": their_offers[sid].name} for sid in they_teach_me],
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results
