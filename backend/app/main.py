import io
import os
import time
from contextlib import asynccontextmanager

from app import models, schemas
from app.auth import get_current_user
from app.db import Base, engine, get_db
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.api_core.exceptions import NotFound
# Google Cloud関連のインポートを統合
from google.cloud import secretmanager, storage
# PPTX解析ライブラリのインポート
from pptx import Presentation
from sqlalchemy import text
from sqlalchemy.orm import Session


# --- Secret Managerからシークレットの値を取得する関数 ---
def access_secret_version(project_id: str, secret_id: str, version_id: str = "latest") -> str:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    payload = response.payload.data.decode("UTF-8")
    return payload

# --- GCSクライアントの設定 ---
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    raise RuntimeError("GCS_BUCKET_NAME environment variable not set.")
storage_client = storage.Client()
bucket = storage_client.bucket(GCS_BUCKET_NAME)

# --- PPTXテキスト抽出関数 ---
def extract_pptx_text_from_file(file_obj):
    """
    ファイルオブジェクト（in-memory）からPPTXテキストを抽出する。
    """
    presentation = Presentation(file_obj)
    full_text = []
    for i, slide in enumerate(presentation.slides):
        slide_text = [f"[スライド {i + 1}]"]
        has_text = False
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            for paragraph in shape.text_frame.paragraphs:
                for run in paragraph.runs:
                    if run.text.strip():
                        slide_text.append(f"  - {run.text.strip()}")
                        has_text = True
        if not has_text:
            slide_text.append("  (テキストなし)")
        full_text.append("\n".join(slide_text))
    return "\n\n".join(full_text)

async def extract_and_print_pptx_text(file: UploadFile):
    """
    アップロードされたPPTXファイルからテキストを抽出し、コンソールに表示する。
    """
    if not file.filename or not file.filename.endswith(".pptx"):
        return

    print(f"\n--- 📄 PPTXファイル '{file.filename}' のテキスト抽出開始 ---")
    try:
        presentation = Presentation(file.file)
        for i, slide in enumerate(presentation.slides):
            print(f"\n[スライド {i + 1}]")
            has_text = False
            for shape in slide.shapes:
                if not shape.has_text_frame:
                    continue
                for paragraph in shape.text_frame.paragraphs:
                    for run in paragraph.runs:
                        if run.text.strip():
                            print(f"  - {run.text.strip()}")
                            has_text = True
            if not has_text:
                print("  (テキストなし)")
    except Exception as e:
        print(f"❌ PPTXファイルの解析中にエラーが発生しました: {e}")
    finally:
        # ファイルポインタを先頭に戻す (後続の処理のため)
        await file.seek(0)
        print("--- ✅ テキスト抽出終了 ---\n")


# --- lifespanイベントハンドラを定義 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # アプリケーション起動時の処理
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
    
    yield
    # アプリケーション終了時の処理 (今回は不要)

# --- FastAPIインスタンスを作成 ---
app = FastAPI(lifespan=lifespan)

# --- CORS設定 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

# --- 認証済みユーザー情報を返す ---
@app.get("/api/me")
def get_me(user=Depends(get_current_user)):
    return user

# --- ルート（ヘルスチェック） ---
@app.get("/api/")
def read_root():
    return {"message": "Hello from MinApp Backend with DB & CORS!"}

# --- Geminiにプロンプトを送信するエンドポイント ---
@app.post("/api/generate", response_model=schemas.GeminiResponse)
def generate_text(prompt_data: schemas.GeminiPrompt, user=Depends(get_current_user)):
    client = genai.Client(vertexai=True, api_key=access_secret_version(project_id=os.getenv("GOOGLE_PROJECT_ID"), secret_id="API_KEY"))
    try:
        response = client.models.generate_content(model="gemini-2.5-flash-lite", contents=prompt_data.prompt)
        return {"response": response.text or "No response text found."}
    except Exception as e:
        print(f"Error generating content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- アイテム一覧取得（自分のデータのみ） ---
@app.get("/api/items", response_model=list[schemas.Item])
def get_items(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Item).filter(models.Item.owner_uid == user["uid"]).all()

# --- アイテム作成（認証必須 + 所有者紐付け） ---
@app.post("/api/items", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_item = models.Item(name=item.name, description=item.description, owner_uid=user["uid"], owner_email=user["email"])
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- 単一アイテム取得（自分のデータのみアクセス可） ---
@app.get("/api/items/{item_id}", response_model=schemas.Item)
def get_item(item_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.owner_uid != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return item

# --- GCSファイル操作API ---

# GCS上のファイル一覧を取得
@app.get("/api/files", response_model=list[schemas.GcsFile])
def list_files(user=Depends(get_current_user)):
    prefix = f"{user['uid']}/"
    blobs = bucket.list_blobs(prefix=prefix)
    return [{"name": b.name.replace(prefix, ""), "updated": b.updated, "size": b.size, "path": b.name}
            for b in blobs if b.name != prefix]

# ファイルをアップロード
@app.post("/api/files/upload")
async def upload_file(user=Depends(get_current_user), file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="ファイルがありません")
    await extract_and_print_pptx_text(file)
    destination_blob_name = f"{user['uid']}/{file.filename}"
    blob = bucket.blob(destination_blob_name)
    try:
        blob.upload_from_file(file.file, content_type=file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"アップロード失敗: {e}")
    return {"filename": file.filename, "path": destination_blob_name}

# ★★★★★ このエンドポイントを追加 ★★★★★
# ファイル内容読み取り
@app.post("/api/files/read", response_model=schemas.FileContent)
def read_file_content(file_path: schemas.GcsFilePath, user=Depends(get_current_user)):
    if not file_path.path.startswith(f"{user['uid']}/"):
        raise HTTPException(status_code=403, detail="Access denied")
    blob = bucket.blob(file_path.path)
    if not blob.exists():
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")
    content = ""
    try:
        file_bytes = blob.download_as_bytes()
        if file_path.path.endswith(".pptx"):
            file_obj = io.BytesIO(file_bytes)
            content = extract_pptx_text_from_file(file_obj)
        else:
            content = "このファイル形式は現在、内容の読み取りに対応していません。"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ファイルの読み取り中にエラーが発生しました: {e}")
    return {"content": content}

# ファイルを削除
@app.delete("/api/files/{file_path:path}")
def delete_file(file_path: str, user=Depends(get_current_user)):
    if not file_path.startswith(f"{user['uid']}/"):
         raise HTTPException(status_code=403, detail="Access denied")
    blob = bucket.blob(file_path)
    try:
        blob.delete()
    except NotFound:
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")
    return {"message": f"ファイル {file_path} を削除しました"}