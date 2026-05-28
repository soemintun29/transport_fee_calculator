from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from mm_geo_coder import geocoder
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for the React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AddressRequest(BaseModel):
    address: str

@app.post("/geocode")
async def geocode_myanmar_address(req: AddressRequest):
    try:
        coder = geocoder.MMGeoCoder(req.address)
        results = coder.get_geolocation()
        
        if not results:
            return {"status": "error", "message": "Address not found"}
            
        # Return the best match (Handle both list and dict returns from mm-geo-coder)
        best_match = results[0] if isinstance(results, list) else results
        
        return {
            "status": "success",
            "lat": best_match['latitude'],
            "lng": best_match['longitude'],
            "name": best_match['address'],
            "source": "mm-geo-coder"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting Myanmar Geocoding API on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
