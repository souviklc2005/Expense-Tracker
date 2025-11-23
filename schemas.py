from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    monthly_budget: float
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int
    class Config:
        from_attributes = True

class BudgetUpdate(BaseModel):
    limit: float

class Token(BaseModel):
    access_token: str
    token_type: str