from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from jose import JWTError, jwt

import models, schemas, database, auth

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    try:
        hashed_pw = auth.get_password_hash(user.password)
        new_user = models.User(username=user.username, hashed_password=hashed_pw)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        print(f"REGISTRATION ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username")
    
    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/users/me/budget")
def update_budget(budget: schemas.BudgetUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    current_user.monthly_budget = budget.limit
    db.commit()
    return {"msg": "Budget updated", "limit": budget.limit}

@app.post("/expenses/", response_model=schemas.ExpenseResponse)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_expense = models.Expense(**expense.dict(), user_id=current_user.id)
    if new_expense.date is None:
        new_expense.date = datetime.utcnow()
        
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@app.get("/expenses/", response_model=List[schemas.ExpenseResponse])
def read_expenses(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Expense).filter(models.Expense.user_id == current_user.id).order_by(models.Expense.date.desc()).all()

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"msg": "Deleted"}

from fastapi.responses import FileResponse
@app.get("/")
def serve_frontend():
    return FileResponse("static/index.html")