# line_app/services/__init__.py
# Service layer for LINE app business logic
# Each module encapsulates a specific domain:
#   - line_sdk: LINE SDK factory, credentials, profile fetching
#   - member_service: Member/friend CRUD, profile management
#   - conversation_service: Conversation thread + message management
