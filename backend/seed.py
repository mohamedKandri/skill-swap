from datetime import datetime, timedelta, timezone
from app import create_app, db
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.session import Session
from app.models.review import Review

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    # ── Users ────────────────────────────────────────────────────────────────
    alex = User(
        name="Alex Rivera",
        email="demo@skillswap.com",
        bio="CS student at MIT. I've been coding in Python for 4 years and love teaching it. Currently trying to pick up Figma and improve my French before a summer internship in Paris.",
        university="MIT",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    )
    alex.set_password("demo1234")

    sara = User(
        name="Sara Chen",
        email="sara@skillswap.com",
        bio="Product design student at Stanford. I live in Figma and Photoshop. Looking to learn Python so I can prototype my own ideas without always needing a developer.",
        university="Stanford",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Sara",
    )
    sara.set_password("demo1234")

    james = User(
        name="James Okafor",
        email="james@skillswap.com",
        bio="Music producer and part-time web dev student at Berklee. I'll teach you music theory or guitar in exchange for help with JavaScript and React.",
        university="Berklee",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    )
    james.set_password("demo1234")

    maya = User(
        name="Maya Patel",
        email="maya@skillswap.com",
        bio="Data science enthusiast at UC Berkeley. Strong in Excel and statistics. Want to learn web dev and improve my French conversation skills.",
        university="UC Berkeley",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
    )
    maya.set_password("demo1234")

    luca = User(
        name="Luca Moretti",
        email="luca@skillswap.com",
        bio="Exchange student from Italy, fluent in French and Italian. Learning Python and data science. Happy to do language exchange sessions.",
        university="Sorbonne",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Luca",
    )
    luca.set_password("demo1234")

    db.session.add_all([alex, sara, james, maya, luca])
    db.session.flush()

    # ── Skills ───────────────────────────────────────────────────────────────
    def skill(name, category):
        s = Skill(name=name, category=category)
        db.session.add(s)
        db.session.flush()
        return s

    python    = skill("Python",        "Programming")
    webdev    = skill("Web Dev",       "Programming")
    react     = skill("React",         "Programming")
    figma     = skill("Figma",         "Design")
    photoshop = skill("Photoshop",     "Design")
    french    = skill("French",        "Language")
    italian   = skill("Italian",       "Language")
    guitar    = skill("Guitar",        "Music")
    music     = skill("Music Theory",  "Music")
    excel     = skill("Excel",         "Productivity")
    stats     = skill("Statistics",    "Data Science")

    # ── User Skills ──────────────────────────────────────────────────────────
    def us(user, s, t):
        db.session.add(UserSkill(user_id=user.id, skill_id=s.id, type=t))

    # Alex: offers Python + Web Dev, wants Figma + French
    us(alex, python,    "offer"); us(alex, webdev,  "offer")
    us(alex, figma,     "want");  us(alex, french,  "want")

    # Sara: offers Figma + Photoshop, wants Python + Web Dev
    us(sara, figma,     "offer"); us(sara, photoshop, "offer")
    us(sara, python,    "want");  us(sara, webdev,    "want")

    # James: offers Guitar + Music Theory, wants Web Dev + React
    us(james, guitar,   "offer"); us(james, music,  "offer")
    us(james, webdev,   "want");  us(james, react,  "want")

    # Maya: offers Excel + Statistics, wants Web Dev + French
    us(maya, excel,     "offer"); us(maya, stats,   "offer")
    us(maya, webdev,    "want");  us(maya, french,  "want")

    # Luca: offers French + Italian, wants Python + Statistics
    us(luca, french,    "offer"); us(luca, italian, "offer")
    us(luca, python,    "want");  us(luca, stats,   "want")

    db.session.flush()

    # ── Sessions ─────────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Alex ↔ Sara — COMPLETED (past)
    s1 = Session(requester_id=alex.id, receiver_id=sara.id,
                 skill_id=python.id, format="online",
                 date=now - timedelta(days=10), status="completed")

    # 2. Sara ↔ Alex — COMPLETED (past, reverse skill)
    s2 = Session(requester_id=sara.id, receiver_id=alex.id,
                 skill_id=figma.id, format="online",
                 date=now - timedelta(days=5), status="completed")

    # 3. Alex ↔ Luca — ACCEPTED / upcoming
    s3 = Session(requester_id=alex.id, receiver_id=luca.id,
                 skill_id=french.id, format="online",
                 date=now + timedelta(days=3), status="accepted")

    # 4. James ↔ Alex — PENDING (James asking Alex for Web Dev)
    s4 = Session(requester_id=james.id, receiver_id=alex.id,
                 skill_id=webdev.id, format="online",
                 date=None, status="pending")

    # 5. Maya ↔ Alex — PENDING (Maya asking Alex for Web Dev)
    s5 = Session(requester_id=maya.id, receiver_id=alex.id,
                 skill_id=webdev.id, format="in-person",
                 date=None, status="pending")

    # 6. Alex ↔ Maya — COMPLETED (past, Alex taught Python to Maya)
    s6 = Session(requester_id=alex.id, receiver_id=maya.id,
                 skill_id=python.id, format="online",
                 date=now - timedelta(days=20), status="completed")

    # 7. Luca ↔ Sara — ACCEPTED / upcoming
    s7 = Session(requester_id=luca.id, receiver_id=sara.id,
                 skill_id=italian.id, format="in-person",
                 date=now + timedelta(days=7), status="accepted")

    db.session.add_all([s1, s2, s3, s4, s5, s6, s7])
    db.session.flush()

    # ── Reviews ──────────────────────────────────────────────────────────────
    reviews = [
        # After s1: Sara reviews Alex (taught Python)
        Review(reviewer_id=sara.id, reviewee_id=alex.id, session_id=s1.id,
               rating=5, comment="Alex is an incredible Python teacher. Super patient and explains things clearly. Already built my first script!"),
        # After s1: Alex reviews Sara (got Figma intro from Sara during s1 debrief)
        Review(reviewer_id=alex.id, reviewee_id=sara.id, session_id=s1.id,
               rating=5, comment="Sara gave me a quick Figma walkthrough at the end of our session. Incredibly talented designer and a great communicator."),

        # After s2: Alex reviews Sara (taught Figma)
        Review(reviewer_id=alex.id, reviewee_id=sara.id, session_id=s2.id,
               rating=5, comment="Best Figma session I could have asked for. Sara structured everything perfectly and shared her component library. Highly recommend!"),
        # After s2: Sara reviews Alex
        Review(reviewer_id=sara.id, reviewee_id=alex.id, session_id=s2.id,
               rating=4, comment="Alex is great to work with. Very punctual and prepared. Looking forward to our next swap."),

        # After s6: Maya reviews Alex
        Review(reviewer_id=maya.id, reviewee_id=alex.id, session_id=s6.id,
               rating=5, comment="Alex made Python feel approachable. We went from zero to a working data script in one session. Will definitely book again."),
        # After s6: Alex reviews Maya
        Review(reviewer_id=alex.id, reviewee_id=maya.id, session_id=s6.id,
               rating=4, comment="Maya is sharp and picks things up fast. She also showed me some Excel tricks I didn't know — bonus value!"),
    ]
    db.session.add_all(reviews)
    db.session.commit()

    print("\nDatabase seeded successfully!\n")
    print("  Login with any of these accounts (password: demo1234)")
    print("  -----------------------------------------------------")
    print("  demo@skillswap.com   -  Alex Rivera  (main demo account)")
    print("  sara@skillswap.com   -  Sara Chen")
    print("  james@skillswap.com  -  James Okafor")
    print("  maya@skillswap.com   -  Maya Patel")
    print("  luca@skillswap.com   -  Luca Moretti")
