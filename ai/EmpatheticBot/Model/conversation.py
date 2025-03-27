from transformers import GPT2Tokenizer, GPT2LMHeadModel
import torch

def generate_response(input_text, model_dir='.', max_length=50):
    tokenizer = GPT2Tokenizer.from_pretrained(model_dir)
    model = GPT2LMHeadModel.from_pretrained(model_dir)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    inputs = tokenizer(
        input_text + " [SEP] ",
        return_tensors='pt',
        padding=True,
        truncation=True,
        max_length=max_length
    )
    input_ids = inputs['input_ids'].to(device)
    attention_mask = inputs['attention_mask'].to(device)

    output = model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        max_length=max_length,
        num_return_sequences=1,
        no_repeat_ngram_size=2,
        top_k=50,
        top_p=0.95,
        temperature=0.7,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )

    response = tokenizer.decode(output[0], skip_special_tokens=True)
    return response.split("[SEP]")[1].strip() if "[SEP]" in response else response

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")

input_text = "I need your help!"
response = generate_response(input_text)
print(f"Chatbot response: {response}")