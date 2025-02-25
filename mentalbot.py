from datasets import Dataset
from transformers import GPT2Tokenizer, GPT2LMHeadModel, Trainer, TrainingArguments
import pandas as pd
import os

# Set Hugging Face cache directory to D drive
os.environ["TRANSFORMERS_CACHE"] = "D:/transformers_cache"
os.environ["HF_DATASETS_CACHE"] = "D:/datasets_cache"

# Load the CSV file using pandas
df = pd.read_csv("Dataset.csv")  # Ensure this path is correct
print(f"Loaded dataset with {len(df)} rows")

# Tokenizer from Hugging Face
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

# Set the padding token to be the same as the eos_token
tokenizer.pad_token = tokenizer.eos_token  # Use eos_token as pad_token

# Preprocess the data
def preprocess_data(df):
    inputs = []
    outputs = []
    for _, entry in df.iterrows():
        context = entry['Context']
        response = entry['Response']
        
        # Format the data for conversational context-response pairs
        inputs.append(f"User: {context}")
        outputs.append(f"Bot: {response}")
    return inputs, outputs

# Preprocess the dataset
inputs, outputs = preprocess_data(df)

# Tokenize the inputs and outputs
inputs_ids = tokenizer(inputs, truncation=True, padding=True, return_tensors="pt")
outputs_ids = tokenizer(outputs, truncation=True, padding=True, return_tensors="pt")

# Prepare the dataset for training
dataset = Dataset.from_dict({
    "input_ids": inputs_ids['input_ids'],
    "labels": outputs_ids['input_ids'],
})

# Load pre-trained GPT-2 model
model = GPT2LMHeadModel.from_pretrained("gpt2")

# Split the dataset into train and eval datasets
train_size = int(0.8 * len(dataset))  # 80% for training
eval_size = len(dataset) - train_size  # 20% for evaluation

train_dataset = dataset.select(range(train_size))
eval_dataset = dataset.select(range(train_size, len(dataset)))

# Define the training arguments with evaluation
training_args = TrainingArguments(
    output_dir="D:/model_results",  # Save the trained model to D drive
    num_train_epochs=3,  # Training for 3 epochs
    per_device_train_batch_size=4,  # Batch size for training
    save_steps=1000,  # Save model checkpoint every 1000 steps
    save_total_limit=2,  # Keep only 2 most recent checkpoints
    logging_steps=100,  # Log every 100 steps
    logging_dir="D:/logs",  # Save logs to D drive
    eval_strategy="no",  # Disable evaluation during training
    report_to="tensorboard"  # Enables tensorboard logging
)

# Initialize the Trainer
trainer = Trainer(
    model=model,  # The model to be trained
    args=training_args,  # Training arguments
    train_dataset=train_dataset,  # Training dataset
    eval_dataset=eval_dataset  # Evaluation dataset
)

# Start training
trainer.train()
