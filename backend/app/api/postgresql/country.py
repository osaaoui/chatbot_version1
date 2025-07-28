# app/api/postgresql/country.py
from fastapi import APIRouter, HTTPException, status
from app.core.base_service import APIResponse, ServiceError
from app.services.postgresql.country_service import CountryService

router = APIRouter()
country_service = CountryService()

def handle_service_error(e: ServiceError):
    raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_all_countries():
    try:
        countries = await country_service.get_all_countries()
        return country_service.success_response(
            "Countries retrieved successfully",
            {"countries": countries}
        )
    except ServiceError as e:
        handle_service_error(e)