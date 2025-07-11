from db import Base, engine, SessionLocal
from models import User, Ingredient, Chemical, Customer
from passlib.context import CryptContext

# Setup for hashing passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # --- Seed admin user ---
    admin_username = "jonmarsh"
    admin_password = "surgro"
    user = db.query(User).filter(User.username.ilike(admin_username)).first()
    if not user:
        hashed_pw = pwd_context.hash(admin_password)
        admin = User(username=admin_username, password_hash=hashed_pw, is_admin=True)
        db.add(admin)
        print(f"Added admin user '{admin_username}'")

    # --- Seed Ingredients ---
    if db.query(Ingredient).count() == 0:
        ingredients = [
            Ingredient(name="Urea", analysis_n=46, analysis_p=0, analysis_k=0, analysis_s=0, density=48, cost_per_ton=400),
            Ingredient(name="DAP", analysis_n=18, analysis_p=46, analysis_k=0, analysis_s=0, density=59, cost_per_ton=600),
            Ingredient(name="Potash", analysis_n=0, analysis_p=0, analysis_k=60, analysis_s=0, density=75, cost_per_ton=550),
            Ingredient(name="Ammonium Sulfate", analysis_n=21, analysis_p=0, analysis_k=0, analysis_s=24, density=62, cost_per_ton=300),
        ]
        db.add_all(ingredients)
        print("Added example ingredients")

    # --- Seed Chemicals ---
    if db.query(Chemical).count() == 0:
        chemicals = [
            Chemical(name="Oxadiazon", ai_percent=50, cost_per_lb=4.0),
            Chemical(name="Prodiamine", ai_percent=65, cost_per_lb=5.5),
        ]
        db.add_all(chemicals)
        print("Added example chemicals")

    # --- Seed Customers ---
    if db.query(Customer).count() == 0:
        customers = [
            Customer(name="Acme Farms", contact="John Doe", email="john@acme.com", phone="555-1000"),
            Customer(name="Bulloch Turf", contact="Jane Smith", email="jane@bulloch.com", phone="555-2000"),
            Customer(name="Statesboro Cotton", contact="Sam Green", email="sam@cotton.com", phone="555-3000"),
        ]
        db.add_all(customers)
        print("Added example customers")

    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
