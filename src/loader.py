from typing import List
from langchain_core.documents import Document
from langchain_community.document_loaders import WebBaseLoader

class WebContentLoader():

    def __init__(self, urls: List[str]):
        self.urls = urls
    
    def load_content(self) -> List[Document]:
        loader = WebBaseLoader(self.urls)

        try:
            documents = loader.load()
            print(f"Successfully loaded content from {len(self.urls)} URLs")
            return documents
        except Exception as e:
            print(f"Error loading content: {str(e)}")
            return []
        



    