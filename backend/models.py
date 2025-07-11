from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_admin = Column(Boolean, default=False)

class Ingredient(Base):
    __tablename__ = "ingredients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    analysis_n = Column(Float, default=0.0)
    analysis_p = Column(Float, default=0.0)
    analysis_k = Column(Float, default=0.0)
    analysis_s = Column(Float, default=0.0)
    analysis_b = Column(Float, default=0.0)    # Boron
    analysis_fe = Column(Float, default=0.0)   # Iron
    analysis_mn = Column(Float, default=0.0)   # Manganese
    analysis_zn = Column(Float, default=0.0)   # Zinc
    analysis_cu = Column(Float, default=0.0)   # Copper
    analysis_mo = Column(Float, default=0.0)   # Molybdenum
    density = Column(Float)
    cost_per_ton = Column(Float)
    is_filler = Column(Boolean, default=False)
    blend_order = Column(Integer, default=0)
    derived_from = Column(String, nullable=True)
    blend_ingredients = relationship("BlendIngredient", back_populates="ingredient")

class Chemical(Base):
    __tablename__ = "chemicals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    ai_percent = Column(Float)
    cost_per_lb = Column(Float)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    contact = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)

class Blend(Base):
    __tablename__ = "blends"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    analysis_n = Column(Float)
    analysis_p = Column(Float)
    analysis_k = Column(Float)
    analysis_s = Column(Float, default=0.0)
    analysis_b = Column(Float, default=0.0)
    analysis_fe = Column(Float, default=0.0)
    analysis_mn = Column(Float, default=0.0)
    analysis_zn = Column(Float, default=0.0)
    analysis_cu = Column(Float, default=0.0)
    analysis_mo = Column(Float, default=0.0)
    acres = Column(Float, nullable=True)
    total_weight = Column(Float)
    application_rate = Column(Float, nullable=True)
    margin = Column(Float, default=0.0)
    added_services = Column(String, nullable=True) # CSV list, e.g. "delivery,spreading"
    notes = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer")
    user = relationship("User")
    ingredients = relationship("BlendIngredient", back_populates="blend", cascade="all, delete-orphan")
    chemicals = relationship("BlendChemical", back_populates="blend", cascade="all, delete-orphan")

class BlendIngredient(Base):
    __tablename__ = "blend_ingredients"
    id = Column(Integer, primary_key=True, index=True)
    blend_id = Column(Integer, ForeignKey("blends.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    weight = Column(Float)
    # Optional: Store micronutrient contribution per ingredient per blend (denormalized)
    blend = relationship("Blend", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="blend_ingredients")

class BlendChemical(Base):
    __tablename__ = "blend_chemicals"
    id = Column(Integer, primary_key=True, index=True)
    blend_id = Column(Integer, ForeignKey("blends.id"))
    chemical_id = Column(Integer, ForeignKey("chemicals.id"))
    weight = Column(Float)
    blend = relationship("Blend", back_populates="chemicals")
    chemical = relationship("Chemical")
