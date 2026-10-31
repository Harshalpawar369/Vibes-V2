from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load variables from .env into os.getenv
load_dotenv() 

print("testing env variables:", os.getenv("MONGODB_URI"))

client = MongoClient(os.getenv("MONGODB_URI"), serverSelectionTimeoutMS=5000)

vectorizer = TfidfVectorizer(stop_words='english')
catalog_matrix = None
item_ids = []

def train_model():
    global catalog_matrix, item_ids, vectorizer
    try:
        db = client.get_database()
        items = list(db["products"].find({"isActive": True}))
        
        if not items:
            return False

        item_ids = [str(item["_id"]) for item in items]
        item_texts = [f"{item.get('category', '')} {item.get('name', '')} {item.get('description', '')}" for item in items]
        
        catalog_matrix = vectorizer.fit_transform(item_texts)
        return True
    except Exception as e:
        print(f"Model training failed: {e}")
        return False

# Replaces the deprecated @app.on_event("startup")
@asynccontextmanager
async def lifespan(app: FastAPI):
    train_model()
    yield # App runs here
    # Clean up resources on shutdown if necessary

app = FastAPI(lifespan=lifespan)

@app.post("/refresh-catalog")
def refresh_catalog():
    if train_model():
        return {"message": "AI Catalog updated successfully"}
    raise HTTPException(status_code=500, detail="Failed to update catalog")

class RequestData(BaseModel):
    user_features: str

@app.post("/recommend")
def recommend(data: RequestData):
    try:
        if catalog_matrix is None or len(item_ids) == 0:
            raise HTTPException(status_code=503, detail="Model is currently unavailable")
            
        user_matrix = vectorizer.transform([data.user_features])
        similarity_scores = cosine_similarity(user_matrix, catalog_matrix)[0]
        
        top_indices = similarity_scores.argsort()[-4:][::-1]
        
        top_ids = []
        for i in top_indices:
            if similarity_scores[i] > 0.05: 
                top_ids.append(item_ids[i])
                
        return {"ids": top_ids}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))