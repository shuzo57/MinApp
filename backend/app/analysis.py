import json
from typing import List

from app.schemas import AnalysisItem
from google import genai
from google.genai import types


def _build_prompt(xml_str: str) -> str:
    return f"""
    あなたは医療・製薬・ヘルスケア資料を審査するコンプライアンス担当者です。
    薬機法および以下の「チェック対象ルール」に照らし、違反または懸念箇所を指摘してください。

    ## チェック対象ルール
    1. 誤字脱字の確認と修正提案
    2. 製品名の不使用（成分名のみを使用）
    3. 恐怖をあおるような表現の禁止
    4. 治癒・完治など断定的治療効果表現の禁止
    5. 医療行為や医療現場を想起させる表現の禁止
    6. 効果・効能の誇大表現の禁止
    7. 出典や作成者名の明記確認（両方とも欠けている場合のみ指摘）
    8. 特定医療機関名への誘導表現の禁止
    9. 一般生活者向け広告表現の禁止（一般用医薬品等を除く）

    ## スライド XML
    {xml_str}

    ### 指摘カテゴリ
    - 誤植 : 誤字脱字
    - 表現 : 表現規制・薬機法違反の可能性
    - 出典 : 出典および作成者情報が両方欠如

    ### 出力要件
    - JSON 配列のみを返す（テキスト装飾・説明文は禁止）
    - スキーマ: slideNumber, category, basis, issue, suggestion
    - slideNumber は XML の number 属性と一致させる
    - basis には違反根拠となるルール番号または薬機法条文を含める
    """.strip()

def analyze_xml(xml_str: str, api_key: str) -> List[AnalysisItem]:
    client = genai.Client(vertexai=True, api_key=api_key)
    prompt = _build_prompt(xml_str)
    resp = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            temperature=0.1,
            response_mime_type="application/json",
            response_schema=list[AnalysisItem],
        ),
    )

    if getattr(resp, "parsed", None):
        return resp.parsed  # list[AnalysisItem]
    data = json.loads(resp.text)
    return [AnalysisItem.model_validate(i) for i in data]
