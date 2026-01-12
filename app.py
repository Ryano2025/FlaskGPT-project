from operator import truediv

from flask import Flask, render_template, request, Response
import os
from dotenv import load_dotenv
from google import generativeai as genai
from pyexpat.errors import messages
from torch.cpu import Stream

app=Flask(__name__)
load_dotenv()
GOOGLE_API_KEY=os.getenv("OPEN_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)


@app.route("/")
def home():
    return render_template("index.html")
@app.route("/prompt",methods=["POST"])
def prompt():
    message=request.json["messages"]
    return Response(event_stream(message),mimetype="text/event-stream")


def event_stream(conversation):
    model=genai.GenerativeModel("gemini-2.5-flash")
    response=model.generate_content(conversation,stream=True)
    for chunk in response:
        if chunk.candidates:
            text=chunk.candidates[0].content.parts[0].text
            if len(text):
                yield text

if __name__=="__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(debug=True,host="0.0.0.0",port=port)
