from transformers import GPT2Tokenizer, GPT2LMHeadModel
import torch

# Refined system prompt for emotional support
SYSTEM_PROMPT = (
    "You are a gentle, caring friend here to support someone who might feel sad, confused, or lonely. "
    "Always respond with kindness and empathy in a simple, clear way. Focus on their feelings and offer comfort. "
    "If they mention missing people or things, ask a gentle question about it or share a kind word. "
    "Avoid medical questions or complex topics—just be a warm, understanding listener. "
    "Remember, you are here to offer comfort and support. "
    
)

def generate_response(input_text, tokenizer, model, device, max_length=50):
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Structured input to guide the model
    full_input = f"{SYSTEM_PROMPT} [SEP] They say: '{input_text}' [SEP] You reply kindly: "
    inputs = tokenizer(
        full_input,
        return_tensors='pt',
        padding=True,
        truncation=True,
        max_length=max_length
    )
    input_ids = inputs['input_ids'].to(device)
    attention_mask = inputs['attention_mask'].to(device)

    # Generate response with tighter control
    output = model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        max_length=max_length + len(tokenizer.encode(SYSTEM_PROMPT)) + 20,
        num_return_sequences=1,
        no_repeat_ngram_size=3,  # Prevent repetition
        top_k=30,                # Narrower for precision
        top_p=0.85,              # Tighter for relevance
        temperature=0.5,         # Lower for less randomness
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
        min_length=len(input_ids[0]) + 5
    )

    # Decode and extract response
    response = tokenizer.decode(output[0], skip_special_tokens=True)
    if "You reply kindly:" in response:
        response = response.split("You reply kindly:")[-1].strip()
    else:
        response = response.split("[SEP]")[-1].strip()

    # Fallback if response is off-topic
    if "dementia" in response.lower() or len(response) < 10 or not response:
        response = "I’m here for you. That sounds hard—want to tell me more?"

    return response

def start_conversation(model_dir=r'ai\EmpatheticBot\Model'):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    print("Chatbot is ready to talk! Type 'stop' to end the conversation.\n")

    # Load model and tokenizer once
    tokenizer = GPT2Tokenizer.from_pretrained(model_dir)
    model = GPT2LMHeadModel.from_pretrained(model_dir)
    model.to(device)

    while True:
        user_input = input("You: ")
        if user_input.lower() == "stop":
            print("Chatbot: Goodbye for now. Take care!")
            break
        
        response = generate_response(user_input, tokenizer, model, device)
        print(f"Chatbot: {response}\n")

if __name__ == "__main__":
    start_conversation()