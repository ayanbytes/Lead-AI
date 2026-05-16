from datetime import datetime

from sqlalchemy import String, DateTime, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class User(Base):
  __tablename__ = "users"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
  full_name: Mapped[str] = mapped_column(String(255), nullable=False)
  password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
  agency_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
  
  # Subscription/Razorpay Fields
  razorpay_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
  razorpay_payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
  plan_type: Mapped[str] = mapped_column(String(50), default="Starter", nullable=False)
  tokens_used: Mapped[int] = mapped_column(default=0, nullable=False)
  tokens_limit: Mapped[int] = mapped_column(default=3, nullable=False)
  # SMTP Settings for outreach
  smtp_server: Mapped[str | None] = mapped_column(String(255), nullable=True)
  smtp_port: Mapped[int | None] = mapped_column(nullable=True)
  smtp_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
  smtp_password: Mapped[str | None] = mapped_column(String(255), nullable=True)

  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
  updated_at: Mapped[datetime] = mapped_column(
    DateTime,
    default=datetime.utcnow,
    onupdate=datetime.utcnow,
    nullable=False,
  )


class Audit(Base):
  __tablename__ = "audits"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

  # Denormalized fields for fast listing/searching
  company_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
  industry: Mapped[str] = mapped_column(String(120), nullable=False, default="General")
  website: Mapped[str | None] = mapped_column(String(512), nullable=True)

  # Full request + response payloads
  request_json: Mapped[dict] = mapped_column(JSON, nullable=False)
  result_json: Mapped[dict] = mapped_column(JSON, nullable=False)

  status: Mapped[str] = mapped_column(String(32), nullable=False, default="Success")
  error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
