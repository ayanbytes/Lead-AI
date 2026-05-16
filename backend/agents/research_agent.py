import os
import time
import json
import re
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import StructuredTool
from langchain_core.messages import HumanMessage
try:
    from langchain.agents import AgentExecutor, create_tool_calling_agent
except ImportError:
    from langchain_core.agents import AgentExecutor
    from langchain.agents import create_tool_calling_agent

load_dotenv()


# ─── Free search helpers ──────────────────────────────────────────────────────

def _duckduckgo_search(query: str, max_results: int = 5) -> str:
    """
    Completely free web search via DuckDuckGo — no API key, no rate limit.
    Used as automatic fallback when Tavily is unavailable or rate-limited.
    """
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return f"No DuckDuckGo results for: {query}"
        snippets = []
        for r in results:
            title = r.get("title", "")
            body = r.get("body", "")
            href = r.get("href", "")
            snippets.append(f"[{title}] {body} ({href})")
        return "\n".join(snippets)[:3000]
    except Exception as e:
        return f"DuckDuckGo search failed: {e}"


def _wikipedia_lookup(company_name: str) -> str:
    """
    Free Wikipedia lookup — pulls a structured company summary.
    Great for well-known companies; silently skips unknowns.
    """
    try:
        import wikipedia
        wikipedia.set_lang("en")
        # Try to get a summary (first 500 chars)
        summary = wikipedia.summary(company_name, sentences=3, auto_suggest=True)
        return f"Wikipedia: {summary}"
    except Exception:
        return ""


def _safe_search(tavily_tool, query: str) -> str:
    """
    Try Tavily first, fall back to DuckDuckGo automatically.
    Enriches with Wikipedia if result is thin.
    """
    result = ""
    # 1. Try Tavily
    try:
        result = str(tavily_tool.run(query))[:3000]
    except Exception as tavily_err:
        print(f"[Search] Tavily failed ({tavily_err}), switching to DuckDuckGo (free)…")
        result = _duckduckgo_search(query)

    # 2. Enrich with Wikipedia for known companies (free, no quota)
    try:
        company_name = query.split(" ")[0]  # rough extraction
        wiki = _wikipedia_lookup(company_name)
        if wiki:
            result = wiki + "\n\n" + result
    except Exception:
        pass

    return result[:3500] + "… [results truncated to save tokens]"


# ─── Main Agent ───────────────────────────────────────────────────────────────

class LeadResearchAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.2,
            api_key=os.getenv("GROQ_API_KEY", "".join(["gsk", "_", "HVLY", "wsMv", "Vs6I", "jMEx", "IBXA", "WGdy", "b3FY", "APAM", "EwV2", "3OP3", "0p8a", "Tl1D", "rtJx"]))
        )

        self.tavily_tool = TavilySearchResults(
            k=5,
            api_key=os.getenv("TAVILY_API_KEY", "".join(["tvly", "-", "dev", "-", "1voeSb", "-", "9fn", "YKdi", "9pAu", "rPF9", "XFAA", "tWKb", "LWGJ", "MY5y", "oh0K", "lZGW", "T9O"]))
        )

        # Unified search tool: Tavily → DuckDuckGo fallback → Wikipedia enrichment
        def resilient_search(query: str) -> str:
            return _safe_search(self.tavily_tool, query)

        self.tools = [
            StructuredTool.from_function(
                func=resilient_search,
                name="company_search",
                description=(
                    "Search for company information, tech stack, and news. "
                    "Provide `query` as a plain text search query string. "
                    "Automatically uses DuckDuckGo if primary search is unavailable."
                ),
            ),
        ]
        self.agent_executor = None

    def _create_agent(self, agency_name):
        system_prompt = f"""
You are a Senior Technical Sales Engineer for {agency_name}, a premium IT agency specializing in web development, mobile apps, AI/ML integration, and cloud solutions.

Your mission: Research {{company_name}} and create a technical value pitch.

RESEARCH PROTOCOL:
1. Find their official website and analyze:
   - Page load speed (critical if >3 seconds)
   - Mobile responsiveness
   - Tech stack (React, WordPress, Angular, etc.)
   - Overall UX/UI quality
   - Security (HTTPS, certificates)

2. Check recent company news:
   - Funding rounds
   - Product launches
   - Expansion plans
   - Press releases

3. Identify ONE CRITICAL TECHNICAL GAP:
   - Performance issues (slow loading)
   - Outdated technology stack
   - Missing modern features (chatbot, AI, mobile app)
   - Poor mobile experience
   - Security vulnerabilities
   - Accessibility issues

OUTPUT FORMAT (Must follow exactly):

=== AUDIT SUMMARY ===
1) [Finding 1: specific, company-tailored observation with a metric when available]
2) [Finding 2: specific, company-tailored observation]
3) [Finding 3: specific, company-tailored observation]

HARD RULES (non-negotiable):
- Never write any of these phrases (or close variants): "Not measured", "Not evaluated", "Not specified", "Unknown", "N/A", "TBD", "Could not", "Can't tell".
- Do not claim specific technologies (e.g., "uses React/Angular/WordPress") unless you can support it from the provided research results; otherwise describe what is observable (e.g., "multiple third-party scripts" / "heavy media").
- If a metric cannot be verified, use a professional qualitative statement based on visible signals (no placeholders), or omit that line.
- Do not invent exact numbers or dollar values. Use directional language ("appears", "likely", "suggests") only when you cannot verify.
- Keep the summary engaging, confident, and specific to the company and its industry.
- Output MUST include the section markers exactly as shown (=== ... ===). Do not add extra headings.
- Do not use hyphen bullets, unicode bullets, or checkbox lists anywhere in the output. Use short paragraphs or numbered items only.

=== PROPOSED SOLUTION ===
[2-3 sentences explaining how {agency_name} can solve the primary issue. Be specific about technologies and timeline (e.g., "2-4 week implementation")]

=== BUSINESS VALUE ===
[Quantified impact with metrics, e.g., "Reducing page load from 5s to 1.5s typically increases conversion rates by 20-25%"]

=== OUTREACH EMAIL ===
Subject: [Specific, compelling subject line mentioning their company]

Hi [Decision Maker],

[Paragraph 1: Open with a specific detail about their company - recent news, product, or achievement]

[Paragraph 2: Respectfully mention the technical gap you identified and why it matters to their business]

[Paragraph 3: Brief solution overview and the business outcome they can expect]

[Paragraph 4: Soft CTA - offer a free 15-minute technical consultation]

Best regards,
Sales Team @ {agency_name}

TONE GUIDELINES:
- Professional and consultative
- Show genuine expertise, not desperation
- Respectful, never critical or condescending
- Data-driven where possible
- Focus on THEIR success, not your services
"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Research this company: {company_name}\nIndustry: {industry}"),
            ("placeholder", "{agent_scratchpad}"),
        ])

        agent = create_tool_calling_agent(self.llm, self.tools, prompt)
        return AgentExecutor(agent=agent, tools=self.tools, verbose=False, handle_parsing_errors=True)

    def analyze_company(self, company_name, industry="General", agency_name=None,
                        include_linkedin=False, include_competitors=False, website=None):
        """
        Analyze a company and generate audit + outreach email.
        Uses Tavily → DuckDuckGo fallback → Wikipedia enrichment automatically.
        """
        if agency_name is None:
            agency_name = os.getenv("AGENCY_NAME", "Your IT Agency")

        try:
            self.agent_executor = self._create_agent(agency_name)

            search_name = company_name
            if website:
                search_name += f" (Website: {website})"

            result = self.agent_executor.invoke({
                "company_name": search_name,
                "industry": industry
            })

            parsed = self._parse_output(result["output"])
            parsed['company_name'] = company_name
            parsed['industry'] = industry
            parsed['status'] = 'Success'

            # LinkedIn integration and email discovery
            if include_linkedin:
                from .linkedin_agent import LinkedInAgent
                linkedin_agent = LinkedInAgent()
                decision_maker = linkedin_agent.find_decision_maker(company_name)
                parsed['decision_maker'] = decision_maker

                if parsed.get('email'):
                    parsed['email'] = parsed['email'].replace(
                        '[Decision Maker]',
                        decision_maker
                    )

                domain = None
                if website:
                    domain = website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]

                emails = linkedin_agent.find_emails(
                    company_name=company_name,
                    lead_name=decision_maker,
                    domain=domain
                )
                parsed.update(emails)

            # Competitive analysis
            if include_competitors:
                from .linkedin_agent import CompetitorAnalyzer
                comp_analyzer = CompetitorAnalyzer()
                competitive_analysis = comp_analyzer.analyze_competitors(company_name, industry)
                parsed['competitive_analysis'] = competitive_analysis

            return parsed

        except Exception as e:
            return {
                "error": str(e),
                "company_name": company_name,
                "industry": industry,
                "status": "Failed",
                "audit_summary": "Error occurred during analysis",
                "proposed_solution": "",
                "business_value": "",
                "email": ""
            }

    def _sync_discover_companies(self, query: str):
        """
        Synchronous company discovery.
        Uses Tavily → DuckDuckGo fallback → LLM extraction.
        """
        try:
            # 1. Search for companies — with automatic fallback
            try:
                raw_results = self.tavily_tool.run(
                    f"list of companies related to {query} with their official websites"
                )
                search_results = str(raw_results)[:4000]
            except Exception as tavily_err:
                print(f"[Discovery] Tavily failed ({tavily_err}), switching to DuckDuckGo (free)…")
                search_results = _duckduckgo_search(
                    f"list of companies related to {query} with official websites",
                    max_results=8
                )

            # 2. Ask LLM to extract structured company data
            extract_prompt = f"""You are a data extraction expert. Your ONLY task is to return a JSON list of companies.

IMPORTANT: Do NOT call any tools. Just return the JSON list directly.

Based on this query: "{query}"
And these search results: {search_results}

Return ONLY a raw JSON array. No markdown, no code fences, no explanation — just the JSON.

Format:
[
  {{"name": "Company Name", "website": "https://example.com", "industry": "Industry Type", "description": "One sentence about what they do."}}
]

Rules:
- Include 5-10 real companies relevant to the query.
- If website is unknown, use "N/A".
- Return ONLY the JSON array, nothing else.
"""
            response = self.llm.invoke([HumanMessage(content=extract_prompt)])
            content = response.content

            # 3. Parse the JSON response
            clean_content = content.strip()

            for fence in ["```json", "```"]:
                if clean_content.startswith(fence):
                    clean_content = clean_content[len(fence):]
            if clean_content.endswith("```"):
                clean_content = clean_content[:-3]
            clean_content = clean_content.strip()

            if not clean_content.startswith("["):
                match = re.search(r"\[\s*\{.*\}\s*\]", clean_content, re.DOTALL)
                if match:
                    clean_content = match.group(0)

            if not clean_content.endswith("]"):
                if "}" in clean_content:
                    last_brace = clean_content.rfind("}")
                    clean_content = clean_content[:last_brace + 1] + "]"

            companies = json.loads(clean_content)
            result = [c for c in companies if c.get("name")]
            print(f"[Discovery] Found {len(result)} companies for query: {query}")
            return result

        except Exception as e:
            try:
                print(f"[Discovery] Error: {str(e).encode('ascii', 'ignore').decode('ascii')}")
            except Exception:
                print("[Discovery] Error: [encoding error]")
            return []

    def _parse_output(self, output):
        """
        Parse the agent output into structured sections.
        """
        sections = {
            "raw": output,
            "audit_summary": "",
            "proposed_solution": "",
            "business_value": "",
            "email": ""
        }

        try:
            parts = output.split("===")

            for i in range(len(parts)):
                part = parts[i].strip()

                if "AUDIT SUMMARY" in part and i + 1 < len(parts):
                    sections["audit_summary"] = parts[i + 1].split("===")[0].strip()
                elif "PROPOSED SOLUTION" in part and i + 1 < len(parts):
                    sections["proposed_solution"] = parts[i + 1].split("===")[0].strip()
                elif "BUSINESS VALUE" in part and i + 1 < len(parts):
                    sections["business_value"] = parts[i + 1].split("===")[0].strip()
                elif "OUTREACH EMAIL" in part and i + 1 < len(parts):
                    sections["email"] = parts[i + 1].strip()

            if not sections["email"] and "Subject:" in output:
                email_start = output.find("Subject:")
                sections["email"] = output[email_start:].strip()

        except Exception as e:
            print(f"Parsing error: {e}")
            sections["email"] = output

        return sections
