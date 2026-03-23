import pandas as pd
from src.vectorstore import VectorStore
from src.retriever import RAGRetriever


if __name__ == "__main__":

    df = pd.read_csv("data/data.csv")
    reviews = list(df["0"])
    store = VectorStore(persist_dir="data/faiss_store")
    rag_search = RAGRetriever(documents=reviews, vector_store=store)


    while True:
        query = input("Enter your query: ")
        summary = rag_search.retrieve(query, k=50)
        print("Summary:", summary)