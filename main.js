import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

let API_KEY = 'AIzaSyBDVULaGoMIezVvIQIaEs366Sr08EUCRG4';

let form = document.querySelector('form');
let fileInput = document.getElementById("fileInput");
let output = document.querySelector('.output');

// Prompt tetap
const fixedPrompt = "Ambil nama sertifikat, credentialsnya, tahun terbit, dan diterbitkan oleh?";

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Menghasilkan analisis...';

  try {
    // Load the image as a base64 string
    const file = fileInput.files[0];
    if (!file) {
      output.textContent = 'Silakan unggah gambar terlebih dahulu.';
      return;
    }

    const imageBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const baseString64 = reader.result.split(',')[1];
        resolve(baseString64);
      }
      reader.onerror = reject;
    });

    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: file.type, data: imageBase64 } },
          { text: fixedPrompt }
        ]
      }
    ];

    // Call the multimodal model, and get a stream of results
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // or gemini-1.5-pro
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    // Read from the stream and interpret the output as markdown
    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    output.innerHTML += '<hr>Error: ' + e.message;
  }
};

// You can delete this once you've filled out an API key
maybeShowApiKeyBanner(API_KEY);
