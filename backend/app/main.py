from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import uuid
import logging
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

from .template_renderer import render_docx
from .ai_client import generate_structured_with_gemini, GeminiError


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("docgen")

BASE_DIR = Path(__file__).resolve().parent         # backend/app
GENERATED = BASE_DIR.parent / "generated"           # backend/generated
TEMPLATES_DIR = BASE_DIR / "templates"              # backend/app/templates
GENERATED.mkdir(parents=True, exist_ok=True)
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)


from fastapi.staticfiles import StaticFiles

app = FastAPI(title="DocGen Backend")

# Serve Static Assets (CSS, JS)
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("../frontend/index.html")



class GenerateRequest(BaseModel):
    doc_type: str
    fields: Optional[Dict] = None
    use_gemini: bool = False
    ai_context: Optional[str] = None
    return_docx: bool = False


@app.post("/generate")
def generate(req: GenerateRequest):
    doc_type = (req.doc_type or "").strip().lower()
    if not doc_type:
        raise HTTPException(status_code=400, detail="doc_type is required")

    template_path = TEMPLATES_DIR / f"{doc_type}_template.docx"
    if not template_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Template for '{doc_type}' not found at {template_path}"
        )

    # Get fields from client or Gemini
# Get fields from client or Gemini
    if req.use_gemini:
        try:
            fields = generate_structured_with_gemini(
                doc_type,
                req.fields or {},
                req.ai_context
            )

            if not isinstance(fields, dict):
                raise ValueError("AI returned non-dict fields")

            # Merge user-provided fields (like Name, Email) into AI fields
            # User fields take precedence if they are explicitly provided (non-empty)
            if req.fields:
                # User fields take precedence if they are explicitly provided (non-empty)
                # BUT: Do not overwrite generated lists (experience, etc.) with the user's "stub" lists.
                skip_keys = {"experience_list", "projects", "education", "achievements", "skills"}
                for k, v in req.fields.items():
                    if v and k not in skip_keys:
                        fields[k] = v

        except GeminiError as ge:
            logger.exception("Gemini generation failed")
            raise HTTPException(status_code=502, detail=f"AI generation failed: {str(ge)}")
        except Exception as e:
            logger.exception("Unexpected AI error")
            raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    else:
        # Manual mode
        if not req.fields:
            raise HTTPException(
                status_code=400,
                detail="fields is required when use_gemini is false"
            )
        fields = req.fields


    # Render DOCX
    fname = f"{doc_type}_{uuid.uuid4().hex[:8]}.docx"
    out_docx = GENERATED / fname
    try:
        render_docx(str(template_path), fields or {}, str(out_docx))
        logger.info("Rendered DOCX: %s", out_docx)
    except Exception as e:
        logger.exception("Template rendering failed")
        raise HTTPException(status_code=500, detail=f"Template rendering failed: {str(e)}")

    # If caller wants the DOCX only, return it
    if req.return_docx:
        if not out_docx.exists():
            raise HTTPException(status_code=500, detail="DOCX was not created")
        return FileResponse(
            path=str(out_docx),
            filename=out_docx.name,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    # Generate PDF via LibreOffice (headless) - Azure/Linux compatible
    pdf_output = out_docx.with_suffix(".pdf")
    try:
        import subprocess
        import platform

        if platform.system() == "Windows":
             # Keep docx2pdf for local Windows testing (if preferred) or use LibreOffice if installed
             from docx2pdf import convert
             convert(str(out_docx), str(pdf_output))
        else:
            # Linux/Container (Azure)
            cmd = [
                "soffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", str(GENERATED),
                str(out_docx)
            ]
            subprocess.run(cmd, check=True)
            
        logger.info("Generated PDF: %s", pdf_output)

    except Exception as e:
        logger.exception("PDF conversion failed")
        return JSONResponse(status_code=500, content={
            "error": "PDF conversion failed (Ensure LibreOffice is installed in container)", 
            "detail": str(e)
        })

    if not pdf_output.exists():
        logger.error("PDF output file missing after conversion")
        return JSONResponse(status_code=500, content={"error": "PDF generation produced no file"})

    return FileResponse(
        path=str(pdf_output),
        filename=pdf_output.name,
        media_type="application/pdf"
    )
# Reload trigger updated