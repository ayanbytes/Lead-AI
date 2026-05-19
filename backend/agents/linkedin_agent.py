import os
import json
import ast
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import PromptTemplate

load_dotenv()

def _duckduckgo_search(query: str, max_results: int = 3) -> list:
    """
    Completely free web search via DuckDuckGo.
    Returns a list of dicts with 'content' and 'url' keys.
    """
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return []
        
        parsed = []
        for r in results:
            title = r.get("title", "")
            body = r.get("body", "")
            href = r.get("href", "")
            parsed.append({
                "content": f"[{title}] {body}",
                "url": href
            })
        return parsed
    except Exception as e:
        print(f"DuckDuckGo search fallback failed: {e}")
        return []

def _safe_search(tavily_tool, query: str, max_results: int = 3) -> list:
    """
    Try Tavily first, fallback to DuckDuckGo automatically.
    Always returns a list of dictionaries with a 'content' key.
    """
    results = None
    # 1. Try Tavily
    try:
        raw_res = tavily_tool.invoke(query)
        if isinstance(raw_res, list):
            results = raw_res
        elif isinstance(raw_res, str):
            # Check if it's an error message or not a valid JSON/list representation
            if "error" in raw_res.lower() or "httperror" in raw_res.lower() or "exception" in raw_res.lower():
                print(f"[Search] Tavily returned error string: {raw_res}, switching to DuckDuckGo...")
            else:
                try:
                    parsed = json.loads(raw_res)
                    if isinstance(parsed, list):
                        results = parsed
                except Exception:
                    try:
                        parsed = ast.literal_eval(raw_res)
                        if isinstance(parsed, list):
                            results = parsed
                    except Exception:
                        pass
    except Exception as e:
        print(f"[Search] Tavily failed with exception ({e}), switching to DuckDuckGo...")

    # 2. Fallback to DuckDuckGo if Tavily failed or returned no results or an error
    if not results:
        results = _duckduckgo_search(query, max_results=max_results)

    # 3. Final sanitization: ensure every item in the list is a dictionary and has a 'content' key
    sanitized = []
    if isinstance(results, list):
        for item in results:
            if isinstance(item, dict):
                sanitized.append(item)
            elif isinstance(item, str):
                sanitized.append({"content": item})
    elif isinstance(results, str):
        sanitized.append({"content": results})
        
    return sanitized


class LinkedInAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.1,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.search = TavilySearchResults(
            k=3,
            api_key=os.getenv("TAVILY_API_KEY")
        )
    
    def find_decision_maker(self, company_name):
        """
        Find CEO/CTO name for the company
        """
        try:
            search_query = f"{company_name} CEO CTO founder LinkedIn 2024"
            results = _safe_search(self.search, search_query)
            
            context = "\n".join([r.get('content', '')[:400] for r in results])[:1200]
            
            prompt = f"""
Based on the following search results, find the current CEO, CTO, or Founder of {company_name}.

Search Results:
{context}

Return ONLY their full name in this format: "FirstName LastName"
If you cannot find a specific name with high confidence, return "Decision Maker"
Do not include titles, positions, or any other information.
"""
            
            response = self.llm.invoke(prompt)
            name = response.content.strip().strip('"\'')
            
            # Validation
            if len(name.split()) > 4 or len(name) < 3:
                return "Decision Maker"
            
            return name if name else "Decision Maker"
            
        except Exception as e:
            print(f"LinkedIn search error: {e}")
            return "Decision Maker"

    def find_emails(self, company_name, domain=None, lead_name=None):
        """
        Find company and lead emails using search
        """
        emails = {
            "company_email": "info@" + (domain if domain else company_name.lower().replace(" ", "") + ".com"),
            "lead_email": ""
        }
        
        try:
            # Search for company emails
            company_query = f"{company_name} contact email address \"@{(domain if domain else company_name.lower().replace(' ', ''))}\""
            results = _safe_search(self.search, company_query)
            
            context = "\n".join([r.get('content', '')[:400] for r in results])[:1200]
            
            prompt = f"""
            Based on the search results, find the most likely official contact email for {company_name}.
            
            Results:
            {context}
            
            Return ONLY the email address. If not found, return "info@{(domain if domain else 'company.com')}".
            """
            response = self.llm.invoke(prompt)
            emails["company_email"] = response.content.strip().strip('"\'')

            # Search for lead email
            if lead_name and lead_name != "Decision Maker":
                lead_query = f"{lead_name} {company_name} email address"
                lead_results = _safe_search(self.search, lead_query)
                
                lead_context = "\n".join([r.get('content', '')[:400] for r in lead_results])[:1200]
                
                lead_prompt = f"""
                Find the email address for {lead_name} at {company_name}.
                
                Results:
                {lead_context}
                
                Return ONLY the email address. If not found, return an empty string.
                """
                lead_response = self.llm.invoke(lead_prompt)
                emails["lead_email"] = lead_response.content.strip().strip('"\'')
                
            return emails
            
        except Exception as e:
            print(f"Email search error: {e}")
            return emails


class CompetitorAnalyzer:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.2,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.search = TavilySearchResults(
            k=3,
            api_key=os.getenv("TAVILY_API_KEY")
        )
    
    def analyze_competitors(self, company_name, industry):
        """
        Find top competitors and compare features
        """
        try:
            search_query = f"{company_name} competitors {industry} comparison features"
            search_results = _safe_search(self.search, search_query)
            
            context = "\n".join([r.get('content', '')[:500] for r in search_results])[:1500]
            
            prompt = f"""
Based on the market research below, identify the top 3 competitors of {company_name} in the {industry} industry.

Market Research:
{context}

For each competitor, identify ONE key feature or technology they have that {company_name} might be missing or could improve.

Return in this exact format:

COMPETITOR 1: [Company Name]
- Key Advantage: [Specific feature or technology]

COMPETITOR 2: [Company Name]  
- Key Advantage: [Specific feature or technology]

COMPETITOR 3: [Company Name]
- Key Advantage: [Specific feature or technology]

Be specific and factual. Focus on technical features, not marketing claims.
"""
            
            response = self.llm.invoke(prompt)
            return response.content.strip()
            
        except Exception as e:
            print(f"Competitor analysis error: {e}")
            return f"Could not complete competitive analysis: {str(e)}"
