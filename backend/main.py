import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn

from src.vectorstore import VectorStore
from src.retriever import RAGRetriever

app = FastAPI(title="RAG Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup – load data & build RAG pipeline once
# ---------------------------------------------------------------------------
rag_search: RAGRetriever | None = None

@app.on_event("startup")
def startup_event():
    global rag_search
    data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "data.csv")
    persist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "faiss_store")

    df = pd.read_csv(data_path)
    reviews = list(df["0"])
    store = VectorStore(persist_dir=persist_dir)
    rag_search = RAGRetriever(documents=reviews, vector_store=store)
    print("RAG pipeline ready.")


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class Message(BaseModel):
    role: str          # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    k: int = 50

class ChatResponse(BaseModel):
    reply: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "rag_ready": rag_search is not None}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if rag_search is None:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialised")

    # Use the last user message as the query
    user_messages = [m for m in req.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="No user message provided")

    query = user_messages[-1].content
    summary = rag_search.retrieve(query, k=req.k)
    return ChatResponse(reply=str(summary))


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)