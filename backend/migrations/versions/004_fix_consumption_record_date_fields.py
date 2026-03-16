"""fix consumption_record date fields: replace consumption_time/stay_duration with stay_date/check_in_date/check_out_date

Revision ID: 004
Revises: 003
Create Date: 2026-03-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new date columns
    op.add_column('consumption_records', sa.Column('stay_date', sa.Date(), nullable=True, comment='入住日期'))
    op.add_column('consumption_records', sa.Column('check_in_date', sa.Date(), nullable=True, comment='入住日期（精確）'))
    op.add_column('consumption_records', sa.Column('check_out_date', sa.Date(), nullable=True, comment='退房日期'))

    # 2. Migrate data: consumption_time → stay_date and check_in_date
    op.execute("UPDATE consumption_records SET stay_date = DATE(consumption_time), check_in_date = DATE(consumption_time) WHERE consumption_time IS NOT NULL")

    # 3. Compute check_out_date from check_in_date + stay_duration
    op.execute("UPDATE consumption_records SET check_out_date = DATE_ADD(check_in_date, INTERVAL stay_duration DAY) WHERE check_in_date IS NOT NULL AND stay_duration IS NOT NULL")

    # 4. Drop old columns
    op.drop_column('consumption_records', 'consumption_time')
    op.drop_column('consumption_records', 'stay_duration')


def downgrade() -> None:
    # 1. Re-add old columns
    op.add_column('consumption_records', sa.Column('consumption_time', sa.DateTime(), nullable=True, comment='消費時間'))
    op.add_column('consumption_records', sa.Column('stay_duration', sa.Integer(), nullable=True, comment='住宿天數'))

    # 2. Migrate data back
    op.execute("UPDATE consumption_records SET consumption_time = stay_date WHERE stay_date IS NOT NULL")
    op.execute("UPDATE consumption_records SET stay_duration = DATEDIFF(check_out_date, check_in_date) WHERE check_in_date IS NOT NULL AND check_out_date IS NOT NULL")

    # 3. Drop new columns
    op.drop_column('consumption_records', 'stay_date')
    op.drop_column('consumption_records', 'check_in_date')
    op.drop_column('consumption_records', 'check_out_date')
