from pathlib import Path
from typing import List, Any
from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from langchain_community.document_loaders import Docx2txtLoader
from langchain_community.document_loaders.excel import UnstructuredExcelLoader
from langchain_community.document_loaders import JSONLoader

        
class DocumentLoader():

    def __init__(self, data_dir: str, doc_types: List[str]):
        self.data_path = Path(data_dir).resolve()
        self.doc_types = doc_types

    def load_documents(self) -> List[Any]:
        documents = []
        for type in self.doc_types:
            match type:
                case "pdf":
                    documents.extend(self.load_pdf())
                case "txt":
                    documents.extend(self.load_txt())
                case "csv":
                    documents.extend(self.load_csv())
                case "xlsx":
                    documents.extend(self.load_xlsx())
                case "docx":
                    documents.extend(self.load_docx())
                case "json":
                    documents.extend(self.load_json())
        print(f"[DEBUG] Total loaded documents: {len(documents)}")
        return documents 

    def load_pdf(self) -> List[Any]:
        pdf_files = list(self.data_path.glob('**/*.pdf'))
        print(f"[DEBUG] Found {len(pdf_files)} PDF files: {[str(f) for f in pdf_files]}")
        for pdf_file in pdf_files:
            print(f"[DEBUG] Loading PDF: {pdf_file}")
            try:
                loader = PyPDFLoader(str(pdf_file))
                loaded = loader.load()
                print(f"[DEBUG] Loaded {len(loaded)} PDF docs from {pdf_file}")
                return loaded
            except Exception as e:
                print(f"[ERROR] Failed to load PDF {pdf_file}: {e}")

    def load_txt(self) -> List[Any]:
        txt_files = list(self.data_path.glob('**/*.txt'))
        print(f"[DEBUG] Found {len(txt_files)} TXT files: {[str(f) for f in txt_files]}")
        for txt_file in txt_files:
            print(f"[DEBUG] Loading TXT: {txt_file}")
            try:
                loader = TextLoader(str(txt_file))
                loaded = loader.load()
                print(f"[DEBUG] Loaded {len(loaded)} TXT docs from {txt_file}")
                return loaded
            except Exception as e:
                print(f"[ERROR] Failed to load TXT {txt_file}: {e}")

    def load_csv(self) -> List[Any]:
        csv_files = list(self.data_path.glob('**/*.csv'))
        print(f"[DEBUG] Found {len(csv_files)} CSV files: {[str(f) for f in csv_files]}")
        for csv_file in csv_files:
            print(f"[DEBUG] Loading CSV: {csv_file}")
            try:
                loader = CSVLoader(str(csv_file))
                loaded = loader.load()
                print(f"[DEBUG] Loaded {len(loaded)} CSV docs from {csv_file}")
                return loaded
            except Exception as e:
                print(f"[ERROR] Failed to load CSV {csv_file}: {e}")

    def load_xlsx(self) -> List[Any]:
        xlsx_files = list(self.data_path.glob('**/*.xlsx'))
        print(f"[DEBUG] Found {len(xlsx_files)} Excel files: {[str(f) for f in xlsx_files]}")
        for xlsx_file in xlsx_files:
            print(f"[DEBUG] Loading Excel: {xlsx_file}")
            try:
                loader = UnstructuredExcelLoader(str(xlsx_file))
                loaded = loader.load()
                print(f"[DEBUG] Loaded {len(loaded)} Excel docs from {xlsx_file}")
                return loaded
            except Exception as e:
                print(f"[ERROR] Failed to load Excel {xlsx_file}: {e}")
    def load_docx(self) -> List[Any]:
        docx_files = list(self.data_path.glob('**/*.docx'))
        print(f"[DEBUG] Found {len(docx_files)} Word files: {[str(f) for f in docx_files]}")
        for docx_file in docx_files:
            print(f"[DEBUG] Loading Word: {docx_file}")
            try:
                loader = Docx2txtLoader(str(docx_file))
                loaded = loader.load()
                print(f"[DEBUG] Loaded {len(loaded)} Word docs from {docx_file}")
                return loaded
            except Exception as e:
                print(f"[ERROR] Failed to load Word {docx_file}: {e}")

    def load_json(self) -> List[Any]:
        json_files = list(self.data_path.glob('**/*.json'))
        print(f"[DEBUG] Found {len(json_files)} JSON files: {[str(f) for f in json_files]}")
        for json_file in json_files:
            print(f"[DEBUG] Loading JSON: {json_file}")
            try:
                loader = JSONLoader(str(json_file))
                loaded = loader.load()
                print(f"[DEBUG] Loaded {len(loaded)} JSON docs from {json_file}")
                return loaded
            except Exception as e:
                print(f"[ERROR] Failed to load JSON {json_file}: {e}")
