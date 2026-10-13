from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
import os

app = FastAPI()

# Connect with a timeout so the app doesn't hang forever if MongoDB is down
client = MongoClient(os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/vibes"), serverSelectionTimeoutMS=5000)

vectorizer = TfidfVectorizer(stop_words='english')
catalog_matrix = None
item_ids = []

def train_model():
    global catalog_matrix, item_ids, vectorizer
    try:
        db = client.get_database()
        # Fetch only active products
        items = list(db["products"].find({"isActive": True}))
        
        if not items:
            return False

        item_ids = [str(item["_id"]) for item in items]
        
        # Build features using the actual schema names from your Node app
        item_texts = [f"{item.get('category', '')} {item.get('name', '')} {item.get('description', '')}" for item in items]
        
        catalog_matrix = vectorizer.fit_transform(item_texts)
        return True
    except Exception as e:
        print(f"Model training failed: {e}")
        return False

# 1. Run once on startup
@app.on_event("startup")
def startup_event():
    train_model()

# 2. Webhook to update catalog
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
            # Added a tiny threshold (0.05) so it doesn't recommend completely unrelated items
            if similarity_scores[i] > 0.05: 
                top_ids.append(item_ids[i])
                
        return {"ids": top_ids}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))