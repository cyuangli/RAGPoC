import os
from typing import List, Any
from src.vectorstore import VectorStore
from src.vectorstore import VectorStore
from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()

class RAGRetriever:

    def __init__(self, documents: List[Any], vector_store: VectorStore, llm_model: str = "gemma2-9b-it"):
        self.vector_store = vector_store
        self.vector_store.build(documents=documents)
        self.vector_store.load()
        groq_api_key = os.getenv("GROQ_API_KEY")
        self.llm = ChatGroq(groq_api_key, llm_model)
        print("Groq LLM initialized.")

    def retrieve(self, query: str, k: int = 5) -> str:
        results = self.vector_store.query(query_text=query, k=k)
        texts = [r["metadata"].get("text", "") for r in results if r["metadata"]]
        context = "/n/n".join(texts)
        if not context:
            print("No results found.")
        prompt = f"""Summarize the following context for the query: '{query}'
        Context:
        {context}
        Summary:"""        
        response = self.llm.invoke([prompt])
        return response.content
    



