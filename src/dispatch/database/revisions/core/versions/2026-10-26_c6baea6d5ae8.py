"""Add locale to dispatch_user_settings

Stores the UI language a user picked in their profile. NULL means the
frontend follows the browser language.

Revision ID: c6baea6d5ae8
Revises: b7e42c1d9a35
Create Date: 2026-10-26 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c6baea6d5ae8"
down_revision = "b7e42c1d9a35"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "dispatch_user_settings",
        sa.Column("locale", sa.String(), nullable=True),
        schema="dispatch_core",
    )


def downgrade():
    op.drop_column("dispatch_user_settings", "locale", schema="dispatch_core")
