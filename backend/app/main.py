import time

from app import models, schemas
from app.db import Base, engine, get_db
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

app = FastAPI()

# --- CORS設定（開発中は全許可、本番では限定推奨） ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- アプリ起動時にDBが立ち上がるまで待機 + テーブル作成 ---
@app.on_event("startup")
def on_startup():
    max_tries = 30
    for i in range(max_tries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            break
        except Exception:
            print(f"⏳ Waiting for database... ({i + 1}/{max_tries})")
            time.sleep(1)
    else:
        raise RuntimeError("❌ Database connection failed after waiting.")

    print("✅ Database connected. Creating tables if not exist...")
    Base.metadata.create_all(bind=engine)


# --- ルート ---
@app.get("/api/")
def read_root():
    return {"message": "Hello from MinApp Backend with DB & CORS!"}


# --- アイテム一覧取得 ---
@app.get("/api/items", response_model=list[schemas.Item])
def get_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).all()
    return items


# --- アイテム作成 ---
@app.post("/api/items", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


# --- 単一アイテム取得 ---
@app.get("/api/items/{item_id}", response_model=schemas.Item)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
