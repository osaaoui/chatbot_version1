from fastapi import APIRouter, HTTPException, status, Depends
from app.services.postgresql.company_service import CompanyService
from app.core.base_service import APIResponse, ServiceError
from app.services.auth_service import get_current_user

router = APIRouter()
company_service = CompanyService()

def handle_service_error(e: ServiceError):
    raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_companies(
    current_user: dict = Depends(get_current_user)
):
    try:
        user_email = current_user["email"]
        companies = await company_service.get_company(user_email)

        return company_service.success_response(
            {"companies": companies}
        )

    except ServiceError as e:
        handle_service_error(e)