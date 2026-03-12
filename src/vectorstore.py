import os
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
        self.metatdata = []
        self.embedding_model = embedding_model
        self.model = SentenceTransformer(self.embedding_model)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        print(f"[Loaded embedding model.")

    def build(self, documents: List[Any]):
        embedding_pipeline = EmbeddingPipeline(model_name=self.embedding_model, chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        texts = embedding_pipeline.generate_chunks(documents=documents)
        embeddings = embedding_pipeline.generate_embeddings(texts=texts)
        self.add(np.array(embeddings).astype("float32"), texts)
        self.save()
        print("Vector store built and saved.")
    
    def add(self, embeddings: np.ndarray, metadatas: List[Any] = None):
        dim = embeddings.shape[1]
        if self.index is None:
            self.index = faiss.IndexFlatL2(dim)
        if metadatas:
            self.metatdata.extend(metadatas)
        print("Added vectors to Faiss index.")

    def save(self):
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        metadata_path = os.path.join(self.persist_dir, "metadata.pkl")

        faiss.write_index(self.index, faiss_path)
        with open(metadata_path, "wb") as file:
            pickle.dump(self.metatdata, file)
        print("Saved Faiss index and metadata.")

    def load(self):
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        metadata_path = os.path.join(self.persist_dir, "metadata.pkl")
        self.index = faiss.read_index(faiss_path)
        with open(metadata_path, "rb") as file:
            self.metadata = pickle.load(file)
        print(f"Loaded Faiss index and metadata from.")
    
    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Any]:
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




