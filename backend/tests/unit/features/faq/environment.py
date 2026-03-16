"""
Behave environment hooks for FAQ Unit Tests.
Uses FakeRepositories and Services — no real DB, no API calls.
"""
import sys
import os
from types import SimpleNamespace

# Add the faq test directory to sys.path so 'app' package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.repositories.industry_repository import IndustryRepository
from app.repositories.faq_category_repository import FaqCategoryRepository
from app.repositories.faq_category_field_repository import FaqCategoryFieldRepository
from app.repositories.faq_rule_repository import FaqRuleRepository
from app.repositories.faq_rule_version_repository import FaqRuleVersionRepository
from app.repositories.faq_module_auth_repository import FaqModuleAuthRepository
from app.repositories.ai_token_usage_repository import AiTokenUsageRepository

from app.services.faq_module_service import FaqModuleService
from app.services.industry_service import IndustryService
from app.services.faq_category_service import FaqCategoryService
from app.services.faq_rule_service import FaqRuleService
from app.services.token_service import TokenService
from app.services.import_export_service import ImportExportService


def before_scenario(context, scenario):
    """Reset state before each scenario."""
    context.last_error = None
    context.query_result = None
    context.ids = {}
    context.memo = {}

    context.repos = SimpleNamespace()
    context.services = SimpleNamespace()

    # Initialize repositories
    context.repos.industry = IndustryRepository()
    context.repos.faq_category = FaqCategoryRepository()
    context.repos.faq_category_field = FaqCategoryFieldRepository()
    context.repos.faq_rule = FaqRuleRepository()
    context.repos.faq_rule_version = FaqRuleVersionRepository()
    context.repos.faq_module_auth = FaqModuleAuthRepository()
    context.repos.ai_token_usage = AiTokenUsageRepository()

    # Initialize services (inject repos)
    context.services.faq_module = FaqModuleService(
        faq_module_auth_repository=context.repos.faq_module_auth,
    )
    context.services.industry = IndustryService(
        industry_repository=context.repos.industry,
        faq_category_repository=context.repos.faq_category,
        faq_category_field_repository=context.repos.faq_category_field,
    )
    context.services.faq_category = FaqCategoryService(
        faq_category_repository=context.repos.faq_category,
        faq_category_field_repository=context.repos.faq_category_field,
        faq_rule_repository=context.repos.faq_rule,
    )
    context.services.faq_rule = FaqRuleService(
        faq_rule_repository=context.repos.faq_rule,
        faq_rule_version_repository=context.repos.faq_rule_version,
        faq_category_repository=context.repos.faq_category,
        faq_category_field_repository=context.repos.faq_category_field,
    )
    context.services.token = TokenService(
        ai_token_usage_repository=context.repos.ai_token_usage,
    )
    context.services.import_export = ImportExportService(
        faq_rule_repository=context.repos.faq_rule,
        faq_category_repository=context.repos.faq_category,
    )


def after_scenario(context, scenario):
    """Cleanup after each scenario."""
    context.last_error = None
    context.query_result = None
    context.ids.clear()
    context.memo.clear()
