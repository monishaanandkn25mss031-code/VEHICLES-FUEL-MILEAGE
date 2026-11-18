import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Vehicle Service & Fuel Mileage Logger"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Supabase credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()
    
    # Defaults
    DEFAULT_CURRENCY_SYMBOL: str = os.getenv("DEFAULT_CURRENCY_SYMBOL", "₹")
    DEFAULT_CURRENCY_CODE: str = os.getenv("DEFAULT_CURRENCY_CODE", "INR")
    DEFAULT_DISTANCE_UNIT: str = os.getenv("DEFAULT_DISTANCE_UNIT", "km")
    DEFAULT_FUEL_UNIT: str = os.getenv("DEFAULT_FUEL_UNIT", "litres")
    
    # SQLite fallback database path
    LOCAL_DB_PATH: Path = BASE_DIR / "local_vehicle_logger.db"

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY and "your-project" not in self.SUPABASE_URL)

settings = Settings()
