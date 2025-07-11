from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import SessionLocal
from models import User, Ingredient, Chemical, Customer, Blend
import auth
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import csv
from io import StringIO
import numpy as np

# ---- FastAPI setup ----

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # NOTE: Restrict in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ---- Dependency helpers ----

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    username = auth.verify_token(token)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    user = db.query(User).filter(User.username.ilike(username)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_current_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return user

# ---- AUTH ----

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    token = auth.create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": current_user.is_admin,
    }

@app.get("/admin-test")
def admin_test(current_user: User = Depends(get_current_admin)):
    return {"msg": f"Hello, admin {current_user.username}!"}

# ---- INGREDIENTS ----

class IngredientBase(BaseModel):
    name: str
    analysis_n: float
    analysis_p: float
    analysis_k: float
    analysis_s: float = 0.0
    density: float
    cost_per_ton: float
    blend_order: int = 0
    derived_from: Optional[str] = ""

class IngredientCreate(IngredientBase): pass

class IngredientUpdate(BaseModel):
    analysis_n: Optional[float] = None
    analysis_p: Optional[float] = None
    analysis_k: Optional[float] = None
    analysis_s: Optional[float] = None
    density: Optional[float] = None
    cost_per_ton: Optional[float] = None
    blend_order: Optional[int] = None
    derived_from: Optional[str] = None

class IngredientOut(IngredientBase):
    id: int
    class Config:
        from_attributes = True

class OrderBody(BaseModel):
    order: List[int]

@app.get("/ingredients", response_model=List[IngredientOut])
def get_ingredients(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Ingredient)
        .order_by(Ingredient.blend_order, Ingredient.name)
        .all()
    )

@app.post("/ingredients", response_model=IngredientOut)
def add_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_ingredient = Ingredient(**ingredient.dict())
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient

@app.put("/ingredients/reorder")
def reorder_ingredients(
    body: OrderBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for idx, ingredient_id in enumerate(body.order):
        db.query(Ingredient).filter(Ingredient.id == ingredient_id).update({"blend_order": idx})
    db.commit()
    return {"status": "ok"}

@app.put("/ingredients/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(ingredient_id: int, updates: IngredientUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(db_ingredient, k, v)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient

@app.delete("/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(db_ingredient)
    db.commit()
    return {"ok": True}

# ---- CHEMICALS ----

class ChemicalBase(BaseModel):
    name: str
    ai_percent: float
    cost_per_lb: float

class ChemicalCreate(ChemicalBase): pass

class ChemicalUpdate(BaseModel):
    ai_percent: Optional[float] = None
    cost_per_lb: Optional[float] = None

class ChemicalOut(ChemicalBase):
    id: int
    class Config:
        from_attributes = True

@app.get("/chemicals", response_model=List[ChemicalOut])
def get_chemicals(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Chemical).order_by(Chemical.name).all()

@app.post("/chemicals", response_model=ChemicalOut)
def add_chemical(chemical: ChemicalCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_chemical = Chemical(**chemical.dict())
    db.add(db_chemical)
    db.commit()
    db.refresh(db_chemical)
    return db_chemical

@app.put("/chemicals/{chemical_id}", response_model=ChemicalOut)
def update_chemical(chemical_id: int, updates: ChemicalUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()
    if not db_chemical:
        raise HTTPException(status_code=404, detail="Chemical not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(db_chemical, k, v)
    db.commit()
    db.refresh(db_chemical)
    return db_chemical

@app.delete("/chemicals/{chemical_id}")
def delete_chemical(chemical_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()
    if not db_chemical:
        raise HTTPException(status_code=404, detail="Chemical not found")
    db.delete(db_chemical)
    db.commit()
    return {"ok": True}

# ---- CUSTOMERS ----

class CustomerBase(BaseModel):
    name: str
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase): pass

class CustomerUpdate(BaseModel):
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerOut(CustomerBase):
    id: int
    class Config:
        from_attributes = True

@app.get("/customers", response_model=List[CustomerOut])
def get_customers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Customer).order_by(Customer.name).all()

@app.post("/customers", response_model=CustomerOut)
def add_customer(customer: CustomerCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.put("/customers/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, updates: CustomerUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(db_customer, k, v)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(db_customer)
    db.commit()
    return {"ok": True}

@app.post("/customers/import")
def import_customers_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    contents = file.file.read().decode("utf-8")
    reader = csv.DictReader(StringIO(contents))
    added = []
    for row in reader:
        name = row.get("name")
        if name and not db.query(Customer).filter(Customer.name == name).first():
            customer = Customer(
                name=name,
                contact=row.get("contact"),
                email=row.get("email"),
                phone=row.get("phone"),
                address=row.get("address"),
            )
            db.add(customer)
            added.append(name)
    db.commit()
    return {"added": added, "count": len(added)}

# ---- USER ADMIN ----

class UserBase(BaseModel):
    username: str
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    is_admin: Optional[bool] = None

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

@app.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.username).all()

@app.post("/users", response_model=UserOut)
def add_user(user: UserCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from auth import get_password_hash
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user_obj = User(
        username=user.username,
        password_hash=get_password_hash(user.password),
        is_admin=user.is_admin,
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj

@app.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, updates: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from auth import get_password_hash
    user_obj = db.query(User).filter(User.id == user_id).first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")
    if updates.password:
        user_obj.password_hash = get_password_hash(updates.password)
    if updates.is_admin is not None:
        user_obj.is_admin = updates.is_admin
    db.commit()
    db.refresh(user_obj)
    return user_obj

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user_obj = db.query(User).filter(User.id == user_id).first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user_obj)
    db.commit()
    return {"ok": True}

# ---- BLEND LOGIC ----

class BlendInput(BaseModel):
    customer_id: int
    calculation_type: str  # 'analysis' or 'per_acre'
    target_n: float
    target_p: float
    target_k: float
    target_s: float = 0.0
    target_b: float = 0.0
    target_fe: float = 0.0
    target_mn: float = 0.0
    target_zn: float = 0.0
    target_cu: float = 0.0
    target_mo: float = 0.0
    acres: Optional[float] = None
    total_weight: Optional[float] = None
    application_rate: Optional[float] = None
    margin: Optional[float] = 0.0
    ingredient_ids: List[int]
    chemicals: Optional[List[Dict[str, Any]]] = []
    added_services: Optional[List[str]] = []

class BlendIngredientResult(BaseModel):
    id: int
    name: str
    weight: float
    cost: float

class BlendChemicalResult(BaseModel):
    id: int
    name: str
    weight: float
    cost: float

class BlendSheetOut(BaseModel):
    ingredients: List[BlendIngredientResult]
    chemicals: List[BlendChemicalResult]
    total_cost: float
    analysis_n: float
    analysis_p: float
    analysis_k: float
    analysis_s: float
    total_weight: float
    notes: Optional[str] = None
    sale_price: Optional[float] = None
    margin: Optional[float] = None
    analysis_b: Optional[float] = None
    analysis_fe: Optional[float] = None
    analysis_mn: Optional[float] = None
    analysis_zn: Optional[float] = None
    analysis_cu: Optional[float] = None
    analysis_mo: Optional[float] = None
    added_services: Optional[List[str]] = []
    application_rate: Optional[float] = None

@app.post("/blend", response_model=BlendSheetOut)
def calculate_blend(
    blend_in: BlendInput = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    ingredients = db.query(Ingredient).filter(Ingredient.id.in_(blend_in.ingredient_ids)).all()
    if len(ingredients) < 1:
        raise HTTPException(status_code=400, detail="No valid ingredients selected")

    mat = np.array([
        [ing.analysis_n/100, ing.analysis_p/100, ing.analysis_k/100, ing.analysis_s/100]
        for ing in ingredients
    ]).T

    if blend_in.calculation_type == "analysis":
        target = np.array([
            blend_in.target_n * blend_in.total_weight / 100,
            blend_in.target_p * blend_in.total_weight / 100,
            blend_in.target_k * blend_in.total_weight / 100,
            blend_in.target_s * blend_in.total_weight / 100,
        ])
        total_weight = blend_in.total_weight
    elif blend_in.calculation_type == "per_acre":
        if not blend_in.acres:
            raise HTTPException(status_code=400, detail="Acres required for per_acre calculation")
        target = np.array([
            blend_in.target_n * blend_in.acres,
            blend_in.target_p * blend_in.acres,
            blend_in.target_k * blend_in.acres,
            blend_in.target_s * blend_in.acres,
        ])
        total_weight = None
    else:
        raise HTTPException(status_code=400, detail="Unknown calculation type")

    try:
        x, residuals, rank, s = np.linalg.lstsq(mat, target, rcond=None)
        weights = np.clip(x, 0, None)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Blend calculation error: {e}")

    sum_weights = float(np.sum(weights))
    if total_weight and sum_weights < total_weight:
        filler = next((ing for ing in ingredients if "filler" in ing.name.lower()), None)
        if not filler:
            filler = ingredients[0]
        idx = ingredients.index(filler)
        weights[idx] += total_weight - sum_weights
        sum_weights = total_weight

    actual = np.dot(mat, weights)
    actual_n, actual_p, actual_k, actual_s = (round(x, 2) for x in actual)

    ingredient_results = []
    total_cost = 0
    for ing, w in zip(ingredients, weights):
        cost = (w / 2000) * ing.cost_per_ton
        ingredient_results.append(BlendIngredientResult(
            id=ing.id,
            name=ing.name,
            weight=round(float(w), 2),
            cost=round(float(cost), 2)
        ))
        total_cost += cost

    chemical_results = []
    if blend_in.chemicals:
        for chem_in in blend_in.chemicals:
            chem = db.query(Chemical).filter(Chemical.id == chem_in.get("chemical_id")).first()
            if chem:
                lbs = float(chem_in.get("lbs_per_ton", 0)) * (sum_weights/2000)
                cost = lbs * chem.cost_per_lb
                chemical_results.append(BlendChemicalResult(
                    id=chem.id,
                    name=chem.name,
                    weight=round(lbs, 2),
                    cost=round(cost, 2)
                ))
                total_cost += cost

    return BlendSheetOut(
        ingredients=ingredient_results,
        chemicals=chemical_results,
        total_cost=round(total_cost, 2),
        analysis_n=actual_n,
        analysis_p=actual_p,
        analysis_k=actual_k,
        analysis_s=actual_s,
        total_weight=round(sum_weights, 2),
        notes="Blend calculation uses least-squares. Filler is added if batch total not met.",
        sale_price=None,
        margin=blend_in.margin,
        analysis_b=blend_in.target_b,
        analysis_fe=blend_in.target_fe,
        analysis_mn=blend_in.target_mn,
        analysis_zn=blend_in.target_zn,
        analysis_cu=blend_in.target_cu,
        analysis_mo=blend_in.target_mo,
        added_services=blend_in.added_services,
        application_rate=blend_in.application_rate,
    )

# ---- BLEND LIST FOR TAG GENERATOR ----

class BlendIngredientOut(BaseModel):
    name: str
    derived_from: Optional[str] = None
    class Config:
        from_attributes = True

class BlendCustomerOut(BaseModel):
    name: str
    class Config:
        from_attributes = True

class BlendOut(BaseModel):
    id: int
    customer: BlendCustomerOut
    analysis_n: float
    analysis_p: float
    analysis_k: float
    analysis_s: float
    total_weight: float
    ingredients: List[BlendIngredientOut]
    class Config:
        from_attributes = True

@app.get("/blends", response_model=List[BlendOut])
def get_blends(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    blends = db.query(Blend).all()
    result = []
    for b in blends:
        ingredient_objs = [
            BlendIngredientOut(
                name=bi.ingredient.name,
                derived_from=bi.ingredient.derived_from or ""
            )
            for bi in b.ingredients
        ]
        result.append(BlendOut(
            id=b.id,
            customer=BlendCustomerOut(name=b.customer.name),
            analysis_n=b.analysis_n,
            analysis_p=b.analysis_p,
            analysis_k=b.analysis_k,
            analysis_s=b.analysis_s,
            total_weight=b.total_weight,
            ingredients=ingredient_objs
        ))
    return result
