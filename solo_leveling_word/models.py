from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nickname = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    wrong_notes = relationship("WrongNote", back_populates="user")

class WrongNote(Base):
    __tablename__ = "wrong_notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String, nullable=False)
    hiragana = Column(String, nullable=False)
    meaning = Column(String, nullable=False)
    level = Column(String, nullable=False, default="N5")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User", back_populates="wrong_notes")
