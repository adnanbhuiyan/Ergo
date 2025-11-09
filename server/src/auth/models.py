from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class UserProfile(Base):
    """
        SQLAlchemy model for the 'userprofile' table
    """
    __tablename__ = "userprofile"

    id: Column = Column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), primary_key=True)

    email: Column = Column(String(255), unique=True, index=True)

    first_name: Column = Column(Text)
    last_name: Column = Column(Text)
    username: Column = Column(Text, unique=True, index=True)
    position: Column = Column(Text)
    profile_photo_url: Column = Column(Text)