import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.prompts import PromptTemplate

load_dotenv()

class LinkedInAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-70b-versatile",
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
            
            context = "\n".join([r.get('content', '')[:500] for r in results])
            
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


class CompetitorAnalyzer:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-70b-versatile",
            temperature=0.2,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.search = TavilySearchResults(
            k=5,
            api_key=os.getenv("TAVILY_API_KEY")
        )
    
    def analyze_competitors(self, company_name, industry):
        """
        Find top competitors and compare features
        """
        try:
            search_query = f"{company_name} competitors {industry} comparison features"
            search_results = self.search.invoke(search_query)
            
            context = "\n".join([r.get('content', '')[:800] for r in search_results])
            
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
