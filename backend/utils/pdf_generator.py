try:
    from fpdf import FPDF
except ModuleNotFoundError as e:
    raise ModuleNotFoundError(
        "Missing dependency for PDF export. Install backend requirements (includes `fpdf2`) "
        "and run using your venv, e.g.:\n"
        "  .\\venv\\Scripts\\python.exe -m pip install -r .\\backend\\requirements.txt\n"
        "  .\\venv\\Scripts\\python.exe .\\backend\\main.py"
    ) from e
from datetime import datetime
import os

class AuditReportPDF(FPDF):
    def __init__(self, agency_name="Your IT Agency"):
        super().__init__()
        self.agency_name = agency_name
        
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.set_text_color(37, 99, 235)  # Blue color
        self.cell(0, 10, f'{self.agency_name}', 0, 1, 'L')
        self.set_font('Arial', '', 12)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, 'Technical Audit Report', 0, 1, 'L')
        self.ln(5)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()} | Generated on {datetime.now().strftime("%Y-%m-%d")}', 0, 0, 'C')
        
    def chapter_title(self, title):
        self.set_font('Arial', 'B', 14)
        self.set_fill_color(59, 130, 246)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, title, 0, 1, 'L', 1)
        self.set_text_color(0, 0, 0)
        self.ln(4)
        
    def chapter_body(self, body):
        self.set_font('Arial', '', 11)
        # Handle unicode characters
        try:
            self.multi_cell(0, 6, body)
        except:
            # Fallback for special characters
            safe_body = body.encode('latin-1', 'replace').decode('latin-1')
            self.multi_cell(0, 6, safe_body)
        self.ln()

def generate_pdf_report(result, agency_name="Your IT Agency", output_filename="audit_report.pdf"):
    """
    Generate a PDF report from analysis result
    """
    pdf = AuditReportPDF(agency_name=agency_name)
    pdf.add_page()
    
    # Company Info Header
    pdf.set_font('Arial', 'B', 12)
    pdf.set_fill_color(239, 246, 255)
    pdf.cell(0, 10, f"Company: {result.get('company_name', 'N/A')}", 0, 1, 'L', 1)
    pdf.set_font('Arial', '', 10)
    pdf.cell(0, 6, f"Industry: {result.get('industry', 'N/A')}", 0, 1, 'L', 1)
    pdf.cell(0, 6, f"Report Date: {datetime.now().strftime('%Y-%m-%d')}", 0, 1, 'L', 1)
    pdf.ln(10)
    
    # Audit Summary
    pdf.chapter_title("Technical Audit Summary")
    pdf.chapter_body(result.get('audit_summary', 'No data available'))
    
    # Proposed Solution
    pdf.chapter_title("Proposed Solution")
    pdf.chapter_body(result.get('proposed_solution', 'No data available'))
    
    # Business Value
    pdf.chapter_title("Expected Business Value")
    pdf.chapter_body(result.get('business_value', 'No data available'))
    
    # Competitive Analysis (if available)
    if result.get('competitive_analysis'):
        pdf.chapter_title("Competitive Landscape")
        pdf.chapter_body(result.get('competitive_analysis'))
    
    # Outreach Email
    pdf.add_page()
    pdf.chapter_title("Recommended Outreach Email")
    pdf.chapter_body(result.get('email', 'No email generated'))
    
    # Save
    try:
        pdf.output(output_filename)
        return output_filename
    except Exception as e:
        print(f"PDF generation error: {e}")
        return None
