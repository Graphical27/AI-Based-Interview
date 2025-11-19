# FastAPI backend (AI Interview — Python)

This folder contains a lightweight FastAPI-based backend which uses LangChain + FAISS for the interview flow.

## Quick start

1. Create a Python venv and activate it (recommended):

```powershell
# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

2. Install requirements:

```powershell
cd fastapi_backend
pip install -r requirements.txt
```

3. Run the server:

```powershell
uvicorn main:app --reload
```

## Common problems & tips

- ModuleNotFoundError: No module named 'langchain'
  - Ensure you're using the Python venv and have installed the requirements from this folder.

- faiss-cpu installation on Windows
  - `faiss-cpu` may fail to build on Windows via pip. If you encounter issues:
    - Use a Linux or macOS system where `faiss-cpu` pip wheels are usually available, or use WSL (Windows Subsystem for Linux).
    - Alternatively, install faiss using conda:

```
conda install -c conda-forge faiss-cpu
```

- If you only need to run the API without vector search for local testing, you can comment out the FAISS parts and fallback to a simple in-memory list of docs.

## Recommended versions

This project works well with modern `langchain` 0.x releases — pin versions in `requirements.txt` if you need reproducibility.

---

If anything fails, paste the full traceback and I'll help you diagnose the issue further.