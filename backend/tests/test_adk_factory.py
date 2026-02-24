import asyncio
import os
import logging
logging.basicConfig(level=logging.ERROR)

from mcp_client import ADK_MCP_Bridge
sqlite_mcp = ADK_MCP_Bridge(
    command='mcp-server-sqlite',
    args=['--db-path', 'test.db']
)

async def test():
    try:
        await sqlite_mcp.connect()
        tools = sqlite_mcp.get_adk_tools()
        print('Discovered MCP Tools:', [t.__name__ for t in tools])
        
        if tools:
            # First tool is read_query
            print('Calling tools[0] name:', tools[0].__name__)
            print('Annotations:', tools[0].__annotations__)
            res = await tools[0](query='SELECT 1 AS test;')
            print('Result:', res)
    finally:
        await sqlite_mcp.disconnect()

asyncio.run(test())
