# MinApp Backend

FastAPI ベースの最小構成バックエンド。

## 起動方法

```bash
# 仮想環境
python -m venv venv
venv\Scripts\activate

# 依存インストール
pip install -r requirements.txt

# 起動
uvicorn app.main:app --reload
