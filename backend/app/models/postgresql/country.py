# app/models/postgresql/country.py
from pydantic import BaseModel

class Country(BaseModel):
    country_id: int
    country_name: str