# crud.py
from typing import Iterable, Sequence

from app.models import Analysis, AnalysisItemRow, File
from app.schemas import AnalysisItem
from sqlalchemy import select
from sqlalchemy.orm import Session


def create_file(
    db: Session,
    *,
    user_id: str,
    filename: str,
    path: str,
    sha256: str,
    size_bytes: int,
) -> File:
    f = File(
        user_id=user_id,
        filename=filename,
        path=path,
        sha256=sha256,
        size_bytes=size_bytes,
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


def get_file(db: Session, file_id: int) -> File | None:
    return db.get(File, file_id)

def list_files(db: Session, user_id: str):
    return db.query(File).filter(File.user_id == user_id).order_by(File.created_at.desc()).all()

def delete_file(db: Session, file_id: int) -> None:
    f = db.get(File, file_id)
    if f:
        db.delete(f)
        db.commit()


def create_analysis(
    db: Session,
    *,
    user_id: str,
    file_id: int,
    model: str,
    rules_version: str | None = None,
    result_json: list[dict] | None = None,
) -> Analysis:
    a = Analysis(
        user_id=user_id,
        file_id=file_id,
        model=model,
        rules_version=rules_version,
        result_json=result_json,
        status="succeeded",
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def bulk_create_analysis_items(
    db: Session, *, analysis_id: int, items: Iterable[AnalysisItem]
) -> Sequence[AnalysisItemRow]:
    rows = [
        AnalysisItemRow(
            analysis_id=analysis_id,
            slide_number=i.slideNumber,
            category=i.category,
            basis=i.basis,
            issue=i.issue,
            suggestion=i.suggestion,
            correction_type=(i.correctionType or "任意"),
        )
        for i in items
    ]
    db.add_all(rows)
    db.commit()
    q = select(AnalysisItemRow).where(AnalysisItemRow.analysis_id == analysis_id).order_by(AnalysisItemRow.id.asc())
    return db.execute(q).scalars().all()


def list_analyses_by_file(db: Session, *, file_id: int, user_id: str) -> list[Analysis]:
    q = (
        select(Analysis)
        .where(Analysis.file_id == file_id, Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
    )
    return list(db.execute(q).scalars().all())


def get_analysis_with_items(db: Session, analysis_id: int) -> tuple[Analysis | None, list[AnalysisItemRow]]:
    a = db.get(Analysis, analysis_id)
    if not a:
        return None, []
    q = select(AnalysisItemRow).where(AnalysisItemRow.analysis_id == analysis_id).order_by(AnalysisItemRow.id.asc())
    items = list(db.execute(q).scalars().all())
    return a, items


def get_latest_analysis(db: Session, file_id: int, user_id: str) -> tuple[Analysis | None, list[AnalysisItemRow]]:
    q = (
        select(Analysis)
        .where(Analysis.file_id == file_id, Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .limit(1)
    )
    latest = db.execute(q).scalar_one_or_none()
    if not latest:
        return None, []

    q_items = (
        select(AnalysisItemRow)
        .where(AnalysisItemRow.analysis_id == latest.id)
        .order_by(AnalysisItemRow.id.asc())
    )
    items = list(db.execute(q_items).scalars().all())
    return latest, items
