"""
app.py
Hugging Face Spaces Entry Point (Free Gradio SDK)
Mounts the production FastAPI analytics engine onto Gradio so it runs on Hugging Face's 16 GB free tier.
"""

import gradio as gr
from main import app as fastapi_app

# Minimal status interface for browser visitors
with gr.Blocks(title="Heart Check PHC Analytics Backend") as demo:
    gr.Markdown("# Heart Check PHC - Analytics Engine")
    gr.Markdown("FastAPI machine learning and forecasting services are active.")

# Mount the full FastAPI app at root so all /api/* routes are exposed directly
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)

