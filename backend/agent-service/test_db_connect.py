
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_connect(url):
    print(f"Testing connection to: {url}")
    try:
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("Success! Result:", result.scalar())
    except Exception as e:
        print(f"Failed: {e}")

async def main():
    # Test 1: Current .env config
    await test_connect("mysql+aiomysql://boardroom:boardroom@localhost:3306/boardroom")
    
    # Test 2: User provided root credentials
    await test_connect("mysql+aiomysql://root:Raje2003@localhost:3306/boardroom")
    
    # Test 3: Root with no password (just in case)
    await test_connect("mysql+aiomysql://root:@localhost:3306/boardroom")

if __name__ == "__main__":
    asyncio.run(main())
