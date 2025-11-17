from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

model = ChatGoogleGenerativeAI(model='gemini-2.5-flash')

class GenerateTitle(BaseModel):
    title: str = Field(
        description="You are given the first user message from a chat conversation. Generate a short, clear, and descriptive title summarizing the message in at most 4-5 words. The title should be concise, meaningful, and easy to recognize in a sidebar chat list. Do not include punctuation like quotes, emojis, or special characters."
    )


structured_model = model.with_structured_output(GenerateTitle)

result = structured_model.invoke("Compare Intel and NVIDIA GPUs")

print(result.title)    # clean title string
