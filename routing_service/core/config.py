import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "RescuePath Routing & Analytical Service"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("ROUTING_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("ROUTING_PORT", "8000"))
    REROUTE_DELAY_THRESHOLD_MINUTES: float = float(os.getenv("REROUTE_DELAY_THRESHOLD_MINUTES", "3.0"))
    GOLDEN_HOUR_LIMIT_MINUTES: float = 60.0
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

settings = Settings()
