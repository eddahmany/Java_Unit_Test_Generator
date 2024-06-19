document.addEventListener('DOMContentLoaded', function() {

    const downloadButton = document.getElementById("downloadButton");
    const chooseButton = document.getElementById("chooseButton");
    const generateButton = document.getElementById("generateButton");
    const uploadingIndicator = document.getElementById("uploadingIndicator");
    const generatingIndicator = document.getElementById("generatingIndicator");
    const downloadedModelsList = document.getElementById("downloadedModelsList");
    const ChosenModelsList = document.getElementById("ChosenModelsList");
    const plbartCheckbox = document.getElementById("plbartCheckbox");
    const santacoderCheckbox = document.getElementById("santacoderCheckbox");
    const choosePlbartCheckbox = document.getElementById("choosePlbartCheckbox");
    const chooseSantacoderCheckbox = document.getElementById("chooseSantacoderCheckbox");

    const defaultJavaCode = "public class Concatenation {\n    public static String concat(String str1, String str2) {\n        return str1 + \" \" + str2;\n    }\n}";
;

    function toggleLoadingIndicator(indicator, show) {
        indicator.style.display = show ? "block" : "none";
    }

    downloadButton.addEventListener("click", () => {
        toggleLoadingIndicator(uploadingIndicator, true);
        let models = [];
        if (plbartCheckbox.checked) models.push("PLBART");
        if (santacoderCheckbox.checked) models.push("SANTACODER");

        fetch("/download_model", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ models })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
            downloadedModelsList.innerHTML = "";
            models.forEach(model => {
                let listItem = document.createElement("li");
                listItem.textContent = `✅ ${model}`;
                downloadedModelsList.appendChild(listItem);
            });
            toggleLoadingIndicator(uploadingIndicator, false);
        })
        .catch(error => {
            console.error("Error:", error);
            toggleLoadingIndicator(uploadingIndicator, false);
        });
    });

    chooseButton.addEventListener("click", () => {
        toggleLoadingIndicator(generatingIndicator, true);
        let models = [];
        if (choosePlbartCheckbox.checked) models.push("PLBART");
        if (chooseSantacoderCheckbox.checked) models.push("SANTACODER");

        ChosenModelsList.innerHTML = "";
        models.forEach(model => {
            let listItem = document.createElement("li");
            listItem.textContent = `✅ ${model}`;
            ChosenModelsList.appendChild(listItem);
        });

        window.chosenModels = models;
        toggleLoadingIndicator(generatingIndicator, false);
    });

    const editor = CodeMirror.fromTextArea(document.getElementById('inputMethod'), {
        lineNumbers: true,
        matchBrackets: true,
        mode: 'text/x-java',
        theme: 'darcula'
    });
    editor.setValue(defaultJavaCode);

    const plbartOutputEditor = CodeMirror.fromTextArea(document.getElementById('plbartOutputTextArea'), {
        lineNumbers: true,
        readOnly: true,
        mode: 'text/x-java',
        theme: 'darcula'
    });

    const santacoderOutputEditor = CodeMirror.fromTextArea(document.getElementById('santacoderOutputTextArea'), {
        lineNumbers: true,
        readOnly: true,
        mode: 'text/x-java',
        theme: 'darcula'
    });

    window.editor = editor;
    window.plbartOutputEditor = plbartOutputEditor;
    window.santacoderOutputEditor = santacoderOutputEditor;

    generateButton.addEventListener("click", () => {
        toggleLoadingIndicator(generatingIndicator, true);

        let inputMethod = window.editor.getValue();
        let selectedModels = window.chosenModels || [];

        fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input_method: inputMethod, selected_models: selectedModels })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
            window.plbartOutputEditor.setValue("");
            window.santacoderOutputEditor.setValue("");
            console.log("data.plbart:", data.plbart);
            let plbartText = data.PLBART || "No output";
            let santacoderText = data.SANTACODER || "No output";

            displayProgressively(window.plbartOutputEditor, plbartText, 20);
            displayProgressively(window.santacoderOutputEditor, santacoderText, 20);

            toggleLoadingIndicator(generatingIndicator, false);
        })
        .catch(error => {
            console.error("Error:", error);
            toggleLoadingIndicator(generatingIndicator, false);
        });
    });

    function displayProgressively(editor, text, delay) {
        editor.setValue("");
        let index = 0;
        let interval = setInterval(() => {
            editor.setValue(text.slice(0, index + 1));
            editor.setCursor(editor.lineCount(), 0);
            index++;
            if (index >= text.length) {
                clearInterval(interval);
            }
        }, delay);
    }
});
