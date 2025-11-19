from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import base64

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
app = FastAPI()

# Allow your frontend domain to reach this API (for now, open; later tighten it)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    # Read file bytes into memory
    pdf_bytes = await file.read()

    # Open PDF with PyMuPDF
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    slides = []

    for page_index in range(len(doc)):
        page = doc.load_page(page_index)

        # Render page to an image
        pix = page.get_pixmap(dpi=150)  # 150–200 good balance
        img_bytes = pix.tobytes("png")

        # For OCR, convert to PIL Image
        pil_img = Image.open(io.BytesIO(img_bytes))

        # OCR the page
        ocr_text = pytesseract.image_to_string(pil_img)

        # Also try to extract text directly from PDF (if any)
        pdf_text = page.get_text("text")

        # Base64 encode image so frontend can show it
        b64_image = base64.b64encode(img_bytes).decode("utf-8")

        slides.append({
            "page": page_index + 1,
            "image_base64": b64_image,
            "text": (pdf_text + "\n" + ocr_text).strip()
        })

    return {
        "success": True,
        "totalSlides": len(slides),
        "slides": slides
    }
