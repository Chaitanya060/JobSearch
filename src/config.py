import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

FIT_SCORE_ALERT_THRESHOLD = int(os.getenv("FIT_SCORE_ALERT_THRESHOLD", "85"))
DAILY_ROLE_BUDGET = int(os.getenv("DAILY_ROLE_BUDGET", "25"))

def _csv(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [x.strip() for x in raw.split(",") if x.strip()]

TARGET_KEYWORDS = _csv("TARGET_KEYWORDS", "python,backend")
TARGET_LOCATIONS = _csv("TARGET_LOCATIONS", "Remote,India")
EXCLUDE_SENIORITY = _csv("EXCLUDE_SENIORITY", "Staff,Principal,Director,VP")

DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
MASTER_RESUME_PATH = DATA_DIR / "master_resume.json"
