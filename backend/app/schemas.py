# app/schemas.py
from pydantic import BaseModel
from datetime import datetime

class ItemBase(BaseModel):
    name: str
    description: str | None = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    owner_uid: str
    owner_email: str

    class Config:
        from_attributes = True

class GeminiPrompt(BaseModel):
    prompt: str

class GeminiResponse(BaseModel):
    response: str

class GcsFile(BaseModel):
    name: str
    updated: datetime
    size: int
    path: str

class GcsFilePath(BaseModel):
    path: str

class GcsFileUrl(BaseModel):
    url: str

class FileContent(BaseModel):
    content: str