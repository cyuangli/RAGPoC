import os
import shutil
import faiss
import numpy as np
import pickle
from typing import List, Any
from sentence_transformers import SentenceTransformer
from src.embedding import EmbeddingPipeline

class VectorStore:
    def __init__(self, persist_dir: str = "../data/faiss_store", embedding_model: str = "all-MiniLM-L6-v2", chunk_size: int = 1000, chunk_overlap: int = 200):
        self.persist_dir = persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)
        self.index = None
        self.metadata = []
        self.faiss_path = os.path.join(self.persist_dir, "faiss.index")
        self.metadata_path = os.path.join(self.persist_dir, "metadata.pkl")
        self.embedding_model = embedding_model
        self.model = SentenceTransformer(self.embedding_model)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        print(f"[Loaded embedding model.")

    def build(self, documents: List[Any]):
        embedding_pipeline = EmbeddingPipeline(model_name=self.embedding_model, chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        texts = embedding_pipeline.generate_chunks(documents=documents)
        parsed_docs = [parse_review(doc) for doc in documents]

        texts = [d["text"] for d in parsed_docs]  # ONLY embed review text

        embeddings = embedding_pipeline.generate_embeddings(texts=texts)

        self.add(np.array(embeddings).astype("float32"), parsed_docs)
        self.save()
        print("Vector store built and saved.")
    
    def add(self, embeddings: np.ndarray, metadatas: List[Any] = None):
        dim = embeddings.shape[1]
        if self.index is None:
            self.index = faiss.IndexFlatL2(dim)
        self.index.add(embeddings) 
        if metadatas:
            self.metadata.extend(metadatas)
        print(f"Added {embeddings.shape[0]} vectors to Faiss index.")
    def save(self):

        faiss.write_index(self.index, self.faiss_path)
        with open(self.metadata_path, "wb") as file:
            pickle.dump(self.metadata, file)
        print("Saved Faiss index and metadata.")

    def delete(self):
        if os.path.exists(self.persist_dir):
            try:
                shutil.rmtree(self.persist_dir)
                print(f"Deleted vector store directory.")
            except OSError as e:
                print(f"Error: {e.strerror}")
        else:
            print(f"This vector store's directory has not been initialized.")

    def load(self):
        try:
            self.index = faiss.read_index(self.faiss_path)
            with open(self.metadata_path, "rb") as file:
                self.metadata = pickle.load(file)
            print(f"Loaded Faiss index and metadata.")
            print(f"Number of embeddings in FAISS: {self.index.ntotal}")
            print(f"Number of metadata entries: {len(self.metadata)}")
        except Exception as e:
            print("Failed to load Faiss index and metadata.")
    
    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Any]:
        if not self.metadata or self.index is None:
            print("Faiss index and metadata are not loaded.")
            return None
        
        D, I = self.index.search(query_embedding, k)
        results = []

        for idx, dist in zip(I[0], D[0]):
            metadata = self.metadata[idx] if idx < len(self.metadata) else None
            results.append({"index" : idx, "distance" : dist, "metadata" : metadata})
        return results
    
    def query(self, query_text: str, k: int = 5) -> List[Any]:
        print(f"Querying vector store for '{query_text}'")
        query_embeddings = self.model.encode([query_text]).astype("float32")
        return self.search(query_embeddings, k)


def parse_review(review: str):
    try:
        name, department, text = review.split(":", 2)
        return {
            "professor": name.strip(),
            "department": department.strip(),
            "text": text.strip()
        }
    except:
        return {
            "professor": None,
            "department": None,
            "text": review
        }