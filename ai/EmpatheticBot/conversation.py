import google.generativeai as genai
import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("Error: GOOGLE_API_KEY not found in .env file. Please create a .env file and set GOOGLE_API_KEY.")
    exit()

genai.configure(api_key=api_key)
tuned_model_name = 'tunedModels/empatheticbot-htv1uagdnucc'
model = genai.get_tuned_model(tuned_model_name)
generative_model = genai.GenerativeModel(model_name=model.name)

conversation_history = []

def generate_response(prompt, history=conversation_history):
  try:
    context = "\n".join([f"User: {u}\nAssistant: {a}" for u, a in history])
    full_prompt = f"{context}\nUser: {prompt}\nAssistant:" 

    response = generative_model.generate_content(
        full_prompt,  
        generation_config=genai.types.GenerationConfig(
            candidate_count=1,
            max_output_tokens=250,
        ),
        stream=False,
    )
    return response.text
  except Exception as e:
    return f"An error occurred: {e}"

print("Welcome! Type 'exit' to end the conversation.")
while True:
    user_input = input("User: ")

    if user_input.lower() == "exit":
        print("Goodbye!")
        break
    response = generate_response(user_input)
    print(f"Assistant: {response}")
    conversation_history.append((user_input, response))
    
    if len(conversation_history) > 5: 
        conversation_history.pop(0) 