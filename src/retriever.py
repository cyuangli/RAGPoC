import os
from typing import List, Any
from src.vectorstore import VectorStore
from src.vectorstore import VectorStore
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate



class RAGRetriever:

    def __init__(self, documents: List[Any], vector_store: VectorStore, llm_model: str = "llama-3.1-8b-instant"):
        self.vector_store = vector_store
        if not os.path.exists(self.vector_store.faiss_path):
            self.vector_store.build(documents=documents)
        self.vector_store.load()
        load_dotenv()
        groq_api_key = os.getenv("GROQ_API_KEY")
        self.llm = ChatGroq(
            api_key=groq_api_key,
            model=llm_model
        )        
        print("Groq LLM initialized.")

    def retrieve(self, query: str, k: int = 5) -> str:
        results = self.vector_store.query(query_text=query, k=k)
        
        metadata_list = [r["metadata"] for r in results if r["metadata"]]

        if not metadata_list:
            return "No relevant reviews found."

        context = "\n\n".join([
            f"{m.get('professor', 'Unknown')} ({m.get('department', 'Unknown')}): {m.get('text', '')}"
            for m in metadata_list
        ])

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant that answers questions about professors based on student reviews."),
            ("user", "{context}\n\nQuestion: {query}\nAnswer:")
        ])

        formatted_prompt = prompt_template.format_prompt(context=context, query=query)

        response = self.llm.invoke(formatted_prompt)


        return response.content