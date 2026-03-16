"""
Import all step definition modules so behave discovers them.
Each step file contains one step pattern (one-step-one-module convention).
"""
# aggregate_given
from faq.aggregate_given.client_auth_setup import *  # noqa: F401, F403
from faq.aggregate_given.user_auth import *  # noqa: F401, F403
from faq.aggregate_given.category_setup import *  # noqa: F401, F403
from faq.aggregate_given.rules_setup import *  # noqa: F401, F403
from faq.aggregate_given.token_setup import *  # noqa: F401, F403
from faq.aggregate_given.system_setup import *  # noqa: F401, F403

# commands
from faq.commands.faq_module_auth import *  # noqa: F401, F403
from faq.commands.system_init import *  # noqa: F401, F403
from faq.commands.toggle_category import *  # noqa: F401, F403
from faq.commands.create_rule import *  # noqa: F401, F403
from faq.commands.edit_rule import *  # noqa: F401, F403
from faq.commands.delete_rule import *  # noqa: F401, F403
from faq.commands.toggle_rule import *  # noqa: F401, F403
from faq.commands.publish import *  # noqa: F401, F403
from faq.commands.token_consume import *  # noqa: F401, F403
from faq.commands.import_export import *  # noqa: F401, F403

# query
from faq.query.list_categories import *  # noqa: F401, F403
from faq.query.category_detail import *  # noqa: F401, F403

# aggregate_then
from faq.aggregate_then.category_state import *  # noqa: F401, F403
from faq.aggregate_then.rule_state import *  # noqa: F401, F403
from faq.aggregate_then.auth_state import *  # noqa: F401, F403
from faq.aggregate_then.industry_state import *  # noqa: F401, F403

# readmodel_then
from faq.readmodel_then.category_list_result import *  # noqa: F401, F403
from faq.readmodel_then.category_detail_result import *  # noqa: F401, F403
from faq.readmodel_then.token_result import *  # noqa: F401, F403

# common_then
from common_then.success_failure import *  # noqa: F401, F403
from common_then.frontend_behavior import *  # noqa: F401, F403
from common_then.ui_display import *  # noqa: F401, F403
