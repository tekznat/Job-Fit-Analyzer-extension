document.addEventListener('DOMContentLoaded', () => {
    // Configure PDF.js worker to point to our local downloaded copy
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
    }

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resumeFile');
    const dropZoneText = document.getElementById('drop-zone-text');
    const saveBtn = document.getElementById('saveBtn');
    const statusMsg = document.getElementById('statusMsg');

    let extractedText = '';

    // Load saved data to see if we already have a resume
    chrome.storage.local.get(['resumeText', 'resumeFileName'], (result) => {
        if (result.resumeText) {
            extractedText = result.resumeText;
            if (result.resumeFileName) {
                dropZoneText.innerText = `Current: ${result.resumeFileName}`;
            } else {
                dropZoneText.innerText = `Resume loaded. Click or drag to replace.`;
            }
        }
    });

    // Handle Drag & Drop UI
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });

    async function handleFile(file) {
        dropZoneText.innerText = `Parsing ${file.name}...`;
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.5';

        try {
            const arrayBuffer = await file.arrayBuffer();
            
            if (file.name.toLowerCase().endsWith('.pdf')) {
                if (typeof pdfjsLib === 'undefined') throw new Error("PDF parser failed to load.");
                extractedText = await extractPdfText(arrayBuffer);
            } else if (file.name.toLowerCase().endsWith('.docx')) {
                if (typeof mammoth === 'undefined') throw new Error("DOCX parser failed to load.");
                extractedText = await extractDocxText(arrayBuffer);
            } else {
                throw new Error("Unsupported file. Please upload .pdf or .docx");
            }

            if (!extractedText || extractedText.trim().length === 0) {
                throw new Error("Could not extract any text from the file.");
            }

            dropZoneText.innerText = `Loaded: ${file.name}`;
            chrome.storage.local.set({ resumeFileName: file.name });
            statusMsg.innerText = "Parsed successfully! Click Save.";
            statusMsg.style.color = "var(--success)";
            statusMsg.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            dropZoneText.innerText = "Click or drag file here to upload";
            statusMsg.innerText = err.message || "Error parsing file.";
            statusMsg.style.color = "#EF4444"; // Red error text
            statusMsg.classList.remove('hidden');
            extractedText = '';
        }
        
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
    }

    async function extractPdfText(arrayBuffer) {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    }

    async function extractDocxText(arrayBuffer) {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }

    // Save data
    saveBtn.addEventListener('click', () => {
        if (!extractedText || !extractedText.trim()) {
            statusMsg.innerText = "Please upload a valid resume first.";
            statusMsg.style.color = "#EF4444";
            statusMsg.classList.remove('hidden');
            return;
        }

        chrome.storage.local.set({
            resumeText: extractedText
        }, () => {
            statusMsg.innerText = "Saved successfully!";
            statusMsg.style.color = "var(--success)";
            statusMsg.classList.remove('hidden');
            setTimeout(() => {
                statusMsg.classList.add('hidden');
            }, 3000);
        });
    });
});
