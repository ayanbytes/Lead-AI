import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import PromptTemplate

load_dotenv()

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
            results = self.search.invoke(search_query)
            
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
            results = self.search.invoke(company_query)
            
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
                lead_results = self.search.invoke(lead_query)
                
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
            search_results = self.search.invoke(search_query)
            
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
