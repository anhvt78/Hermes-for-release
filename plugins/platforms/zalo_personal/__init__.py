"""Independent Zalo personal-account plugin for Hermes."""

from .adapter import register as register_platform
from .cli import register_cli


def register(ctx):
    register_platform(ctx)
    ctx.register_cli_command(
        name="zalo_personal",
        help="Đăng nhập và vận hành Zalo cá nhân cho profile này",
        setup_fn=register_cli,
    )
