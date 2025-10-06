import time

from app import models, schemas
from app.auth import get_current_user
from app.db import Base, engine, get_db
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

app = FastAPI()

# --- CORS設定（開発中は全許可、本番では限定推奨） ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番では特定ドメインのみに絞る
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

# --- アプリ起動時にDB接続確認＋テーブル作成 ---
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

# --- 認証済みユーザー情報を返す ---
@app.get("/api/me")
def get_me(user=Depends(get_current_user)):
    return user

# --- ルート（ヘルスチェック） ---
@app.get("/api/")
def read_root():
    return {"message": "Hello from MinApp Backend with DB & CORS!"}

# --- アイテム一覧取得（自分のデータのみ） ---
@app.get("/api/items", response_model=list[schemas.Item])
def get_items(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    items = db.query(models.Item).filter(models.Item.owner_uid == user["uid"]).all()
    return items

# --- アイテム作成（認証必須 + 所有者紐付け） ---
@app.post("/api/items", response_model=schemas.Item)
def create_item(
    item: schemas.ItemCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_item = models.Item(
        name=item.name,
        description=item.description,
        owner_uid=user["uid"],
        owner_email=user["email"],
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- 単一アイテム取得（自分のデータのみアクセス可） ---
@app.get("/api/items/{item_id}", response_model=schemas.Item)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.owner_uid != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return item
