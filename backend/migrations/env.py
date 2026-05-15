"""
Alembic 環境配置
"""
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# 導入 Base 和所有模型
from app.database import Base
from app.config import settings
import app.models  # 確保所有模型被導入

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# 對 alembic 隱形的表（line_app 自管，backend 不該介入）。
# 歷史脈絡：commit cbd3057a 2025-11-27「移除 backend 中所有問卷相關代碼」明確把
# survey 系統的 model / API / service / scheduler 整套從 backend 砍掉，問卷功能
# 移由 line_app 獨立管理（line_app/manage_survey.py CLI + line_app/app.py raw SQL +
# LIFF route）。表還在 DB 上是必要的（line_app 需要操作），但 backend alembic
# 不應該把它們當作 drift 或試圖管理。
EXCLUDED_TABLES = {
    "surveys",
    "survey_questions",
    "survey_responses",
    "survey_templates",
}


def _include_object(obj, name, type_, reflected, compare_to):
    """過濾 alembic 對 EXCLUDED_TABLES 的偵測與管理。"""
    if type_ == "table" and name in EXCLUDED_TABLES:
        return False
    # Index 也要過濾（不然 alembic 會抱怨 ix_survey_* 是 removed index）
    if type_ == "index":
        tbl_name = getattr(obj, "table", None)
        if tbl_name is not None and getattr(tbl_name, "name", None) in EXCLUDED_TABLES:
            return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url") or settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=_include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=_include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = config.get_main_option("sqlalchemy.url") or settings.DATABASE_URL
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
