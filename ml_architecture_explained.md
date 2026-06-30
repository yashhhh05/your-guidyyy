# Full-Stack ML Microservice Architecture

This guide explains how we migrated the image transcription pipeline from a third-party API (Cloudflare) to a custom, self-hosted **Python FastAPI microservice running Microsoft’s Florence-2-base vision model on a Hugging Face Space**.

---

## 🗺️ System Architecture

Our application is built as a **Decoupled Microservice Architecture**:

```
 ┌────────────────────────┐                   ┌────────────────────────┐
 │   🌐 Web App (Vercel)  │ ──(HTTP POST)───> │   🐍 AI Brain (HF)     │
 │   - Next.js / TypeScript │                   │   - FastAPI / Python   │
 │   - Supabase Database  │ <──(JSON text)─── │   - Florence-2 Model   │
 └────────────────────────┘                   └────────────────────────┘
```

*   **Vercel (Next.js)** handles the student website, user authentication (Clerk), database records (Supabase), and voice streaming (Vapi).
*   **Hugging Face Spaces (FastAPI)** serves as our specialized machine learning microservice, performing CPU-based image description.

---

## 📁 File-by-File Breakdown (`ml-service/` folder)

Here is a breakdown of what every file inside the `/ml-service` folder does:

### 1. `requirements.txt` (The Python Environment)
This file lists the Python packages that need to be downloaded to configure the server.
*   `fastapi` & `uvicorn[standard]`: Used to build the web framework and serve the API.
*   `torch`: PyTorch (loaded with `--extra-index-url https://download.pytorch.org/whl/cpu` to ensure we install the lightweight CPU-only version rather than the massive 2GB CUDA GPU version).
*   `transformers==4.41.2`: **(Crucial)** Pinned to this specific version because newer versions (v4.45+) changed the key-value (KV) cache classes. Florence-2 expects standard Python tuples for caching. Pinning this version prevents the `'NoneType' object has no attribute 'shape'` error.
*   `timm`: PyTorch Image Models. Used by Florence-2 for its ResNet/Vision Transformer visual backbone.
*   `einops` & `sentencepiece`: Libraries required by Hugging Face to parse the model structure and tokenize text input.

### 2. `app.py` (The API Server Code)
This is the application code that loads the model and runs the calculations.
*   **CORS Configuration:** Enables Cross-Origin Resource Sharing so that your web app running on Vercel can securely send requests to Hugging Face.
*   **Model Loader:**
    ```python
    model = AutoModelForCausalLM.from_pretrained(
        model_id, 
        trust_remote_code=True, 
        attn_implementation="eager"
    ).to(device)
    ```
    Loads the weights using `AutoModelForCausalLM` (Causal Language Model) and forces `attn_implementation="eager"`. This bypasses compatibility checks for GPU-centric Scaled Dot Product Attention (SDPA), which would otherwise crash on Hugging Face’s CPU.
*   **Image Downloader (`io.BytesIO`):** Downloads the entire image file as a byte-array from UploadThing, then opens it with Pillow (`Image.open`). This prevents partial stream downloads that lead to corrupted inputs.
*   **Inference Endpoint (`/analyze`):** Exposes an HTTP POST route that runs the visual model and returns a JSON response containing the text description.

### 3. `flash_attn/` (The Mock Module Hack)
This is a folder containing a single empty `__init__.py` file.
*   **Why we need it:** Florence-2's internal code contains an `import flash_attn` statement. Because `flash_attn` requires an NVIDIA GPU to compile, it cannot be installed on a CPU. Hugging Face's safety scanner blocks deployments if it sees `import flash_attn` in the code but not in `requirements.txt`.
*   **How it works:** By placing a local folder named `flash_attn` in the root folder, Python finds this empty folder and successfully completes the import statement. The model then realizes FlashAttention is not active and falls back to standard attention without throwing an `ImportError`.

---

## 🐳 Why do we use a `Dockerfile`?

A `Dockerfile` is an **instruction manual for building a container image**. 

Without Docker, running Python code in the cloud is fragile because of the "it works on my machine" problem—variations in operating systems, Python versions, or environment configurations can cause the code to crash.

### How Docker solves this:
1.  **Guarantees Consistency:** It bundles the Linux Operating System, Python version 3.9, your files, and all packages from `requirements.txt` into a single, isolated package called an **Image**. This image runs *exactly* the same on Hugging Face as it does on your local machine.
2.  **Handles Hugging Face Security:** Hugging Face Spaces require containers to run under a secure, non-root user (UID 1000) for safety. Our `Dockerfile` handles this configuration automatically:
    ```dockerfile
    # Set up a secure non-root user (required by Hugging Face)
    RUN useradd -m -u 1000 user
    USER user
    ```
3.  **Configures the Network Port:** Hugging Face expects web servers to listen on port `7860`. Our `Dockerfile` starts the web server on this exact port using Uvicorn:
    ```dockerfile
    CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
    ```

---

## 🎙️ Interview Cheat-Sheet

Here is how to answer interview questions about this architecture:

### 1. "Why didn't you build this entire project on Vercel?"
> *"Vercel functions are serverless and have strict resource limits (capping function sizes at 50MB-250MB and execution timeouts at 10 seconds). Machine learning frameworks like PyTorch and visual model weights require over 2GB of disk space and persistent RAM. To build a robust system, I decoupled the architecture: Vercel serves the Next.js app, and a dedicated Docker container on Hugging Face Spaces serves the AI model."*

### 2. "What was the most challenging part of deploying the model?"
> *"Handling dependency compatibility in the cloud. I resolved two major issues: first, a KV cache mismatch between the latest `transformers` library and Florence-2's dynamic modules which I fixed by pinning `transformers==4.41.2`. Second, I solved a CPU compilation issue with `flash_attn` by building an empty python mock module, which satisfied the model's import checks on a CPU-only server."*

### 3. "Why did you choose Florence-2 over standard OCR libraries?"
> *"Standard OCR libraries (like Tesseract) only transcribe text. Florence-2 is a multimodal vision foundation model. It can transcribe text and math equations, but it can also describe diagrams, charts, and graphs in detail, providing rich conversational context to our AI voice tutor."*
