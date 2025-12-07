"""
Comprehensive Research Paper Extraction Agent using Pydantic AI
This module implements a sophisticated research paper analysis system.
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from research_extraction_models import ComprehensiveExtractionResult

@dataclass
class ExtractionDependencies:
    """Dependencies for the extraction agent."""
    extraction_settings: Dict[str, Any]
    user_preferences: Dict[str, Any]
    paper_context: Dict[str, Any]

class ResearchExtractionAgent:
    """Comprehensive research paper extraction agent."""
    
    def __init__(self, model_name: str = "google/gemini-2.5-flash-lite", api_key: str = None):
        # Configure OpenRouter provider with Google Gemini 2.5 Flash Lite
        model = OpenAIModel(
            model_name,
            provider=OpenRouterProvider(api_key=api_key or 'your-openrouter-api-key')
        )
        
        self.agent = Agent(
            model,
            deps_type=ExtractionDependencies,
            output_type=ComprehensiveExtractionResult,
            system_prompt=self._get_base_system_prompt()
        )
        
        # Add dynamic system prompt for contextual extraction
        self.agent.system_prompt(self._add_extraction_context)
        self.agent.system_prompt(self._add_quality_guidelines)
        self.agent.system_prompt(self._add_user_preferences)

    def _get_base_system_prompt(self) -> str:
        return """
You are an expert research analyst and academic paper extraction specialist with deep knowledge across multiple scientific disciplines. Your task is to perform comprehensive, systematic analysis of research papers with exceptional attention to detail and accuracy.

CORE RESPONSIBILITIES:
1. Extract ALL statistical data, findings, and quantitative results with precise context
2. Identify and extract methodology details with scientific rigor
3. Capture relevant quotes that support key arguments and findings
4. Assess research quality using established academic standards
5. Provide comprehensive metadata and citation information
6. Generate detailed summaries tailored to user preferences

EXTRACTION PRINCIPLES:
- ACCURACY: Every extracted piece of information must be precisely accurate to the source
- COMPREHENSIVENESS: Leave no important detail unanalyzed
- CONTEXT: Always provide sufficient context for each extraction
- VERIFICATION: Cross-reference findings throughout the paper
- SCHOLARLY RIGOR: Apply appropriate academic standards for evaluation

STATISTICAL EXTRACTION REQUIREMENTS:
- Extract ALL numerical results: p-values, confidence intervals, effect sizes, correlations, sample sizes
- Include units, statistical tests used, and degrees of freedom where applicable
- Note statistical significance levels and power analysis results
- Capture descriptive statistics: means, standard deviations, medians, ranges
- Document any statistical assumptions or limitations mentioned

METHODOLOGY EXTRACTION REQUIREMENTS:
- Identify study design (RCT, observational, meta-analysis, systematic review, etc.)
- Extract sample characteristics: size, demographics, inclusion/exclusion criteria
- Document data collection procedures and instruments
- Identify statistical analysis methods and software used
- Note randomization, blinding, and control procedures
- Extract follow-up periods and outcome measures

QUOTE EXTRACTION REQUIREMENTS:
- Focus on impactful statements that support key findings
- Include direct quotes about limitations and potential biases
- Extract methodological descriptions that could be replicated
- Capture author interpretations of results
- Include quotes about future research directions
- Prioritize quotes suitable for literature reviews and citations

QUALITY ASSESSMENT REQUIREMENTS:
- Evaluate methodology rigor using appropriate frameworks
- Assess statistical analysis adequacy
- Identify potential sources of bias
- Evaluate reporting completeness and transparency
- Consider external validity and generalizability
- Note peer review status and journal quality indicators
"""

    @staticmethod
    async def _add_extraction_context(ctx: RunContext[ExtractionDependencies]) -> str:
        """Add context-specific extraction guidelines."""
        settings = ctx.deps.extraction_settings
        paper_type = ctx.deps.paper_context.get('type', 'unknown')
        
        context_prompt = f"""
EXTRACTION CONTEXT:
Paper Type: {paper_type}
Extraction Focus: {settings.get('focus_areas', ['general'])}

SPECIFIC EXTRACTION REQUIREMENTS:
"""
        
        # Add quotes-specific instructions
        if settings.get('quotes', {}).get('enabled', False):
            quotes_config = settings['quotes']
            context_prompt += f"""
QUOTES EXTRACTION:
- Extract {quotes_config.get('maxPerPaper', 10)} most relevant quotes
- Minimum quote length: {quotes_config.get('minLength', 50)} characters
- Maximum quote length: {quotes_config.get('maxLength', 500)} characters
- Priority focus: {quotes_config.get('priority', 'high_impact')}
- Quote types needed: methodology, findings, limitations, implications
"""

        # Add statistics-specific instructions
        if settings.get('statistics', {}).get('enabled', False):
            stats_config = settings['statistics']
            context_prompt += f"""
STATISTICS EXTRACTION:
- Include p-values: {stats_config.get('includePValues', True)}
- Include confidence intervals: {stats_config.get('includeConfidenceIntervals', True)}
- Include effect sizes: {stats_config.get('includeEffectSizes', True)}
- Minimum sample size threshold: {stats_config.get('minSampleSize', 10)}
- Extract ALL statistical tests and their assumptions
"""

        # Add summary-specific instructions
        if settings.get('summaries', {}).get('enabled', False):
            summary_config = settings['summaries']
            context_prompt += f"""
SUMMARY REQUIREMENTS:
- Summary length: {summary_config.get('length', 'moderate')}
- Focus areas: {summary_config.get('focusAreas', ['findings', 'methodology'])}
- Include methodology: {summary_config.get('includeMethodology', True)}
- Include limitations: {summary_config.get('includeLimitations', True)}
- Include implications: {summary_config.get('includeImplications', True)}
"""

        return context_prompt

    @staticmethod
    async def _add_quality_guidelines(ctx: RunContext[ExtractionDependencies]) -> str:
        """Add quality assessment guidelines."""
        return """
QUALITY ASSESSMENT FRAMEWORK:

METHODOLOGY RIGOR (0-100):
- 90-100: Randomized controlled trial with appropriate controls, blinding, and power analysis
- 80-89: Well-designed observational study with appropriate controls
- 70-79: Adequate study design with minor methodological concerns
- 60-69: Acceptable study with notable limitations
- Below 60: Significant methodological flaws

STATISTICAL ADEQUACY (0-100):
- Consider appropriate test selection, assumption verification, multiple comparison corrections
- Assess adequacy of sample size and power
- Evaluate handling of missing data and confounders
- Check for appropriate statistical reporting standards

BIAS RISK ASSESSMENT:
- Selection bias: How participants were chosen and allocated
- Performance bias: Differences in care received
- Detection bias: Differences in outcome assessment
- Attrition bias: Differences in participant dropout
- Reporting bias: Selective reporting of outcomes

REPORTING COMPLETENESS:
- CONSORT, STROBE, or other relevant reporting guidelines compliance
- Transparency in methodology and data availability
- Clear description of limitations and potential conflicts
"""

    @staticmethod
    async def _add_user_preferences(ctx: RunContext[ExtractionDependencies]) -> str:
        """Add user-specific preferences and context."""
        prefs = ctx.deps.user_preferences
        research_field = prefs.get('research_field', 'general')
        experience_level = prefs.get('experience_level', 'intermediate')
        
        return f"""
USER CONTEXT:
Research Field: {research_field}
Experience Level: {experience_level}

CUSTOMIZED EXTRACTION APPROACH:
- Tailor technical language appropriately for {experience_level} level
- Emphasize aspects most relevant to {research_field} research
- Provide field-specific quality indicators and standards
- Include terminology and concepts familiar to {research_field} researchers

RELEVANCE SCORING CONTEXT:
- Weight findings based on relevance to {research_field}
- Consider methodological standards specific to this field
- Evaluate generalizability within the research domain
"""

    async def extract_from_paper(
        self, 
        paper_text: str, 
        paper_url: Optional[str] = None,
        extraction_settings: Optional[Dict[str, Any]] = None,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> ComprehensiveExtractionResult:
        """
        Extract comprehensive information from a research paper.
        
        Args:
            paper_text: Full text of the research paper
            paper_url: Optional URL of the paper
            extraction_settings: User's extraction preferences
            user_preferences: User's research context and preferences
            
        Returns:
            ComprehensiveExtractionResult: Structured extraction results
        """
        
        # Set up dependencies
        deps = ExtractionDependencies(
            extraction_settings=extraction_settings or {},
            user_preferences=user_preferences or {},
            paper_context={
                'url': paper_url,
                'length': len(paper_text),
                'type': self._infer_paper_type(paper_text)
            }
        )
        
        # Create comprehensive extraction prompt
        extraction_prompt = f"""
Please perform a comprehensive analysis and extraction of the following research paper. Extract ALL relevant information according to the structured output format, ensuring maximum accuracy and completeness.

PAPER CONTENT:
{paper_text}

EXTRACTION REQUIREMENTS:
1. Analyze the entire paper systematically from title to references
2. Extract ALL statistical findings with complete context
3. Identify ALL methodological details and procedures
4. Capture quotes that represent key findings, methods, and limitations
5. Provide comprehensive metadata including full citation information
6. Assess research quality using established academic standards
7. Generate detailed summary covering all major aspects
8. Score relevance based on user context and preferences

CRITICAL REQUIREMENTS:
- Be exhaustive in statistical extraction - miss no p-values, effect sizes, or confidence intervals
- Provide sufficient context for each statistic to understand what it represents
- Extract methodology with enough detail for replication assessment
- Include quotes suitable for academic citation and literature review
- Assess bias risk and methodological limitations honestly
- Generate citation information in proper academic format

ACCURACY IS PARAMOUNT: Every piece of extracted information must be precisely accurate to the source material.
"""

        try:
            # Run the extraction
            result = await self.agent.run(extraction_prompt, deps=deps)
            return result.output
            
        except Exception as e:
            # Create error response with as much information as possible
            return self._create_error_response(str(e), paper_url, extraction_settings)

    def _infer_paper_type(self, paper_text: str) -> str:
        """Infer the type of research paper from content."""
        text_lower = paper_text.lower()
        
        if 'systematic review' in text_lower or 'meta-analysis' in text_lower:
            return 'systematic_review'
        elif 'randomized controlled trial' in text_lower or 'rct' in text_lower:
            return 'rct'
        elif 'case study' in text_lower or 'case report' in text_lower:
            return 'case_study'
        elif 'observational' in text_lower or 'cohort' in text_lower:
            return 'observational'
        elif 'review' in text_lower:
            return 'review'
        else:
            return 'empirical'

    def _create_error_response(
        self, 
        error_msg: str, 
        paper_url: Optional[str],
        extraction_settings: Optional[Dict[str, Any]]
    ) -> ComprehensiveExtractionResult:
        """Create an error response when extraction fails."""
        from research_extraction_models import (
            PaperMetadata, Summary, KeyFinding, MethodologyDetails, 
            QualityAssessment, RelevanceScoring, Citations
        )
        
        return ComprehensiveExtractionResult(
            id=f"error_{datetime.now().isoformat()}",
            status="failed",
            paper_url=paper_url,
            extraction_type="comprehensive",
            metadata=PaperMetadata(
                title="Extraction Failed",
                authors=[],
                journal=None,
                publication_date=None,
                volume=None,
                issue=None,
                pages=None,
                doi=None,
                abstract=None,
                keywords=[],
                research_field=[],
                funding_sources=[],
                conflicts_of_interest=None,
                word_count=None,
                figure_count=None,
                table_count=None,
                reference_count=None
            ),
            summary=Summary(
                executive_summary="Extraction failed due to technical error",
                detailed_summary="The paper analysis could not be completed",
                key_findings=[],
                research_gaps=[],
                novelty_aspects=[],
                practical_implications=[],
                theoretical_contributions=[],
                word_count=0,
                focus_areas=[]
            ),
            quotes=[],
            statistics=[],
            methodology=MethodologyDetails(
                study_design="Unknown",
                sample_size=None,
                population="",
                inclusion_criteria=[],
                exclusion_criteria=[],
                data_collection_methods=[],
                statistical_methods=[],
                control_groups=[],
                randomization=None,
                blinding=None,
                duration=None,
                power_analysis=None
            ),
            quality_assessment=QualityAssessment(
                overall_quality="unknown",
                methodology_rigor=0.0,
                statistical_adequacy=0.0,
                reporting_completeness=0.0,
                bias_risk="unknown",
                limitations=[],
                strengths=[],
                peer_review_status=None
            ),
            relevance=RelevanceScoring(
                relevance_score=0.0,
                breakdown={},
                matching_keywords=[],
                topic_alignment=0.0,
                methodology_quality=0.0,
                recency_score=0.0,
                citation_impact=0.0,
                explanation=[f"Extraction failed: {error_msg}"]
            ),
            citations=Citations(
                full_citation="",
                in_text_citation="",
                bibtex=None,
                doi=None,
                url=paper_url,
                page_numbers=[],
                isbn=None,
                pmid=None
            ),
            processing_info={
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            },
            extraction_confidence=0.0,
            system_prompt_used="Error occurred before prompt execution",
            model_settings=extraction_settings or {},
            warnings=[f"Extraction failed: {error_msg}"],
            limitations=["Complete extraction failed due to technical error"],
            created_at=datetime.now().isoformat()
        )

# Factory function for easy usage
def create_research_extraction_agent(
    model_name: str = "google/gemini-2.5-flash-lite",
    api_key: str = None
) -> ResearchExtractionAgent:
    """Create a new research extraction agent using OpenRouter with Google Gemini."""
    return ResearchExtractionAgent(model_name, api_key)

# Example usage function
async def extract_research_paper(
    paper_text: str,
    paper_url: Optional[str] = None,
    extraction_settings: Optional[Dict[str, Any]] = None,
    user_preferences: Optional[Dict[str, Any]] = None,
    model_name: str = "google/gemini-2.5-flash-lite",
    api_key: str = None
) -> ComprehensiveExtractionResult:
    """
    High-level function to extract information from a research paper.
    
    This is the main entry point for the research extraction system.
    """
    agent = create_research_extraction_agent(model_name, api_key)
    return await agent.extract_from_paper(
        paper_text=paper_text,
        paper_url=paper_url, 
        extraction_settings=extraction_settings,
        user_preferences=user_preferences
    )