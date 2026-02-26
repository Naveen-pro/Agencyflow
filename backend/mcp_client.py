"""
MCP JSON-RPC 2.0 client for communicating with MCP servers.
"""
import json
import subprocess
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class MCPClient:
    """Simple MCP client that communicates via stdio JSON-RPC."""

    def __init__(self, command: str, args: list[str], env: dict = None):
        self.command = command
        self.args = args
        self.env = env or {}

    async def call_tool(self, tool_name: str, arguments: dict = None) -> Any:
        """Call an MCP tool and return the result."""
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments or {},
            },
        }

        try:
            result = subprocess.run(
                [self.command] + self.args,
                input=json.dumps(request),
                capture_output=True,
                text=True,
                timeout=30,
                env={**self.env},
            )

            if result.returncode != 0:
                logger.error(f"MCP tool {tool_name} failed: {result.stderr}")
                return None

            response = json.loads(result.stdout)
            return response.get("result")

        except Exception as e:
            logger.error(f"MCP call failed: {e}")
            return None

    async def list_tools(self) -> list:
        """List available tools from the MCP server."""
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
        }

        try:
            result = subprocess.run(
                [self.command] + self.args,
                input=json.dumps(request),
                capture_output=True,
                text=True,
                timeout=15,
            )

            if result.returncode != 0:
                return []

            response = json.loads(result.stdout)
            return response.get("result", {}).get("tools", [])

        except Exception:
            return []
