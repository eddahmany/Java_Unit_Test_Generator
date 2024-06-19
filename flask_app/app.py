from flask import Flask, request, jsonify, render_template, url_for
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM, pipeline
import re
app = Flask(__name__)

# Global variables to store the models and pipelines
plbart_model = None
plbart_tokenizer = None
santacoder_model = None
santacoder_tokenizer = None


def reformat_java(code):
    code = re.sub(r'\s+', ' ', code)
    code = code.replace('; ', ';\n')
    code = code.replace('{ ', '{\n')
    code = code.replace('} ', '}\n')

    indentation_level = 0
    formatted_code = ""
    for line in code.split('\n'):
        if '}' in line:
            indentation_level -= 1
        formatted_code += '    ' * indentation_level + line.strip() + '\n'
        if '{' in line:
            indentation_level += 1

    return formatted_code.strip()


def load_plbart():
    global plbart_model, plbart_tokenizer
    plbart_tokenizer = AutoTokenizer.from_pretrained("ayoub-edh/Finetuned_PLBART_Java_Unit_Test_Generator")
    print('------------------------------------------------------------------------------------------')
    print('plbart tokenizer loaded succefully')
    print('------------------------------------------------------------------------------------------')
    plbart_model = AutoModelForSeq2SeqLM.from_pretrained("ayoub-edh/Finetuned_PLBART_Java_Unit_Test_Generator")
    print('plbart model loaded succefully')
    print('------------------------------------------------------------------------------------------')

def load_santacoder():
    global santacoder_model, santacoder_tokenizer
    santacoder_tokenizer = AutoTokenizer.from_pretrained("ayoub-edh/Finetuned_SANTACODER_Java_Unit_Test_Generator")
    print('------------------------------------------------------------------------------------------')
    print('santacoder_tokenizer loaded succefully')
    print('------------------------------------------------------------------------------------------')
    santacoder_model = AutoModelForCausalLM.from_pretrained("ayoub-edh/Finetuned_SANTACODER_Java_Unit_Test_Generator", trust_remote_code=True)
    print('------------------------------------------------------------------------------------------')
    print('santacoder_model loaded succefully')
    print('------------------------------------------------------------------------------------------')

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/download_model', methods=['POST'])
def download_model():
    data = request.get_json()
    print('------------------------------------------------------------------------------------------')
    print('request.get_json()',str(request.get_json()))
    print('------------------------------------------------------------------------------------------')
    models = data.get('models', [])
    if 'PLBART' in models:
        load_plbart()
    if 'SANTACODER' in models:
        load_santacoder()
    return jsonify({'status': 'success'})


@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    input_method = data.get('input_method', '')
    print('------------------------------------------------------------------------------------------')
    print('input_method',str(input_method))
    print('------------------------------------------------------------------------------------------')
    selected_models = data.get('selected_models', [])
    print('------------------------------------------------------------------------------------------')
    print('selected_models : ',str(selected_models))
    print('------------------------------------------------------------------------------------------')
    results = {}

    device = 0 if torch.cuda.is_available() else -1
    print('------------------------------------------------------------------------------------------')
    print(' PLBART in selected_models ? : ', str('PLBART' in selected_models))
    print('------------------------------------------------------------------------------------------')
    if 'PLBART' in selected_models and plbart_model and plbart_tokenizer:

        pipe = pipeline("translation", model=plbart_model, tokenizer=plbart_tokenizer, device=device)
        output = pipe(input_method, max_new_tokens=512, num_return_sequences=1, src_lang='java', tgt_lang='java')[0]['translation_text']
        print('------------------------------------------------------------------------------------------')
        print(' reformat_java(output) : ', str(reformat_java(output)))
        print('------------------------------------------------------------------------------------------')
        results['PLBART'] = reformat_java(output)
    if 'SANTACODER' in selected_models and santacoder_model and santacoder_tokenizer:
        pipe = pipeline("text-generation", model=santacoder_model, tokenizer=santacoder_tokenizer, device=device)
        output = pipe(input_method, max_new_tokens=512, num_return_sequences=1)[0]['generated_text']
        results['SANTACODER'] = output

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
