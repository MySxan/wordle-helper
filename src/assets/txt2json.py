import json

with open('words.txt', 'r', encoding='utf-8') as f:
    words = [line.strip() for line in f if line.strip()]  

with open('words.json', 'w', encoding='utf-8') as f:
    json.dump(words, f, ensure_ascii=False, indent=2)
