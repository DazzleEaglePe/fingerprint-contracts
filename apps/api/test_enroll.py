import httpx
import io
import asyncio
from PIL import Image

async def main():
    # Create a dummy image
    img = Image.new('L', (100, 100), color=255)
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='BMP')
    img_bytes = img_byte_arr.getvalue()
    
    # 1. Login to get token
    async with httpx.AsyncClient() as client:
        r = await client.post("http://localhost:8000/api/auth/login", data={"username":"admin@fundo.com", "password":"admin123"})
        token = r.json()["access_token"]
        
        # 2. Get owners
        r = await client.get("http://localhost:8000/api/owners/", headers={"Authorization": f"Bearer {token}"})
        owners = r.json()
        owner_id = owners[0]["id"]
        
        # 3. Enroll
        files = {'image': ('test.bmp', img_bytes, 'image/bmp')}
        r = await client.post(f"http://localhost:8000/api/biometric/enroll/{owner_id}", files=files, headers={"Authorization": f"Bearer {token}"})
        print("Status:", r.status_code)
        print("Response:", r.text)

if __name__ == "__main__":
    asyncio.run(main())
