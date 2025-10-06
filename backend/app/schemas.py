# app/schemas.py
from pydantic import BaseModel


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
