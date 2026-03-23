import os
from dotenv import load_dotenv
load_dotenv()
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Make sure to set the GROQ_API_KEY environment variable before running
# export GROQ_API_KEY="your-groq-api-key-here"

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("user", "{text}")
])

chain = prompt | llm | StrOutputParser()


while True:

    user_input = input("Enter your query: ")
    response = chain.invoke({"text": user_input})
    print(response)
