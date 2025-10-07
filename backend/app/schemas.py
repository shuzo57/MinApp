from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

CorrectionType = Literal["必須", "任意"]

class AnalysisItem(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: str
    basis: str
    issue: str
    suggestion: str
    correctionType: Optional[CorrectionType] = "任意"

class AnalysisItemCreate(BaseModel):
    slideNumber: int = Field(..., ge=1)
    category: str
    basis: str
    issue: str
    suggestion: str
    correctionType: Optional[CorrectionType] = "任意"

class AnalysisItemUpdate(BaseModel):
    slideNumber: Optional[int] = Field(None, ge=1)
    category: Optional[str] = None
    basis: Optional[str] = None
    issue: Optional[str] = None
    suggestion: Optional[str] = None
    correctionType: Optional[CorrectionType] = None

# ---- ユーザー情報（レスポンス用に露出したい場合のみ）----
class FirebaseUser(BaseModel):
    userId: str = Field(serialization_alias="userId")
    email: Optional[str] = None
    emailVerified: Optional[bool] = None

# ---- File ----
class FileBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    filename: str
    path: str
    sha256: str
    sizeBytes: int = Field(serialization_alias="sizeBytes")

class FileCreate(FileBase):
    # userId は認証から付与するため受け取らない
    pass

class FileRead(FileBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: int
    userId: str = Field(serialization_alias="userId")
    createdAt: str = Field(serialization_alias="createdAt")

# ---- Analysis ----
class AnalysisBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    fileId: int = Field(serialization_alias="fileId")
    model: str
    rulesVersion: Optional[str] = Field(default=None, serialization_alias="rulesVersion")
    status: str = "succeeded"

class AnalysisCreate(AnalysisBase):
    # Create時: userId は受け取らない（サーバ側でuid注入）
    items: Optional[List[AnalysisItemCreate]] = None

class AnalysisRead(AnalysisBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: int
    userId: str = Field(serialization_alias="userId")
    createdAt: str = Field(serialization_alias="createdAt")
    items: List[AnalysisItem] = []


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